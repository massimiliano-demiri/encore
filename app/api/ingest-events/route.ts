import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// ── Supabase admin (service role) ──
function getAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) return null
	return createClient(url, key, { auth: { persistSession: false } })
}

// ── Centro di Città di Castello e raggio di pertinenza ──
const CDC_LAT = 43.4564
const CDC_LNG = 12.2385
const CDC_RADIUS_KM = 40

const CDC_LOCALITIES = [
	"città di castello", "citta di castello", "san giustino", "umbertide",
	"sansepolcro", "trestina", "selci", "lama", "citerna", "monterchi",
	"anghiari", "pietralunga", "montone", "morra",
]

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLng = ((lng2 - lng1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function cleanTitle(name: string): string {
	return name
		.replace(/\s*[-–|]\s*biglietti.*$/i, "")
		.replace(/\s*biglietti.*$/i, "")
		.replace(/\s+in concerto.*$/i, "")
		.replace(/\s+live\b.*$/i, "")
		.trim() || name.trim()
}

function extractEvents(jsonLdBlocks: string[]): any[] {
	const out: any[] = []
	const visit = (node: any) => {
		if (!node || typeof node !== "object") return
		if (Array.isArray(node)) { node.forEach(visit); return }
		const t = node["@type"]
		const isEvent = t === "Event" || (Array.isArray(t) && t.includes("Event"))
		if (isEvent) out.push(node)
		if (node.itemListElement) visit(node.itemListElement)
		if (node.item) visit(node.item)
		if (node["@graph"]) visit(node["@graph"])
	}
	for (const raw of jsonLdBlocks) {
		try { visit(JSON.parse(raw)) } catch { /* blocco non valido, skip */ }
	}
	return out
}

function eventbriteId(url: string | undefined, fallback: string): string {
	if (!url) return fallback
	const m = url.match(/(\d{6,})(?:\?|$|\/)/)
	return m ? m[1] : fallback
}

async function fetchEventbrite(sourceUrl: string): Promise<any[]> {
	const res = await fetch(sourceUrl, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
		},
	})

	if (res.status === 403 || res.status === 429) {
		throw new Error("Eventbrite ha bloccato la richiesta (anti-bot " + res.status + ")")
	}
	if (!res.ok) throw new Error("Eventbrite HTTP " + res.status)

	const html = await res.text()
	if (html.includes("cf-challenge") || html.includes("Just a moment")) {
		throw new Error("Eventbrite: challenge Cloudflare, fetch semplice non basta")
	}

	const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
		.map((m) => m[1])
	const events = extractEvents(blocks)

	const rows: any[] = []
	for (const e of events) {
		const loc = e.location ?? null
		const geo = loc?.geo ?? null
		const lat = geo?.latitude != null ? Number(geo.latitude) : null
		const lng = geo?.longitude != null ? Number(geo.longitude) : null
		const addr = loc?.address
		const city = (typeof addr === "object" ? addr?.addressLocality : null) ?? null
		const addressStr =
			typeof addr === "string"
				? addr
				: [addr?.streetAddress, addr?.addressLocality, addr?.postalCode]
						.filter(Boolean)
						.join(", ") || null

		let keep = false
		if (lat != null && lng != null) {
			keep = haversineKm(CDC_LAT, CDC_LNG, lat, lng) <= CDC_RADIUS_KM
		} else {
			const hay = ((city ?? "") + " " + (addressStr ?? "")).toLowerCase()
			keep = CDC_LOCALITIES.some((l) => hay.includes(l))
		}
		if (!keep) continue

		const offers = Array.isArray(e.offers) ? e.offers[0] : e.offers
		const price = offers?.lowPrice ?? offers?.price ?? null
		const ticketUrl = offers?.url ?? e.url ?? null

		if (!e.startDate || !e.name) continue

		rows.push({
			source_event_id: eventbriteId(e.url, e.name + "|" + e.startDate),
			artist_name: cleanTitle(String(e.name)),
			artist_mbid: null,
			venue: loc?.name ?? "",
			address: addressStr,
			city,
			lat,
			lng,
			starts_at: e.startDate,
			ticket_url: ticketUrl,
			price_min: price != null ? Number(price) : null,
			price_currency: offers?.priceCurrency ?? (price != null ? "EUR" : null),
		})
	}
	return rows
}

async function fetchSource(source: string, sourceUrl: string): Promise<any[]> {
	if (source === "eventbrite") return fetchEventbrite(sourceUrl)
	return []
}

// ── Geocoding (solo per righe senza coordinate) ──
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
	try {
		const url =
			"https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(query)
		const res = await fetch(url, {
			headers: { "User-Agent": "EncoreApp/1.0 (contact: m.demiri@hotmail.it)" },
		})
		if (!res.ok) return null
		const data = await res.json()
		if (!Array.isArray(data) || !data[0]) return null
		return { lat: Number(data[0].lat), lng: Number(data[0].lon) }
	} catch {
		return null
	}
}

// ── Handler: POST { source, sourceUrl } ──
export async function POST(request: Request) {
	const supabase = getAdmin()
	if (!supabase) {
		return NextResponse.json({ error: "Supabase non configurato (manca service role key)" }, { status: 500 })
	}

	let body: any
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 })
	}

	const source = body?.source
	const sourceUrl = body?.sourceUrl
	if (!source || !sourceUrl) {
		return NextResponse.json({ error: "source e sourceUrl sono obbligatori" }, { status: 400 })
	}

	let rawRows: any[]
	try {
		rawRows = await fetchSource(source, sourceUrl)
	} catch (err) {
		return NextResponse.json({ error: String(err) }, { status: 502 })
	}

	if (!rawRows.length) {
		return NextResponse.json({ ingested: 0, message: "Nessun evento trovato/pertinente" })
	}

	const rows: any[] = []
	for (const r of rawRows) {
		let lat = r.lat
		let lng = r.lng
		if ((lat == null || lng == null) && (r.venue || r.city || r.address)) {
			const g = await geocode([r.venue, r.address, r.city, "Italia"].filter(Boolean).join(", "))
			if (g) { lat = g.lat; lng = g.lng }
			await sleep(1100)
		}
		rows.push({
			source,
			source_url: sourceUrl,
			source_event_id: r.source_event_id,
			artist_name: r.artist_name,
			artist_mbid: r.artist_mbid ?? null,
			venue: r.venue ?? "",
			address: r.address ?? null,
			city: r.city ?? null,
			lat,
			lng,
			starts_at: r.starts_at,
			ticket_url: r.ticket_url ?? null,
			price_min: r.price_min ?? null,
			price_currency: r.price_currency ?? null,
			status: "pending",
		})
	}

	const { data, error } = await supabase
		.from("events")
		.upsert(rows, { onConflict: "source,source_event_id" })
		.select("id")

	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ ingested: data?.length ?? rows.length })
}