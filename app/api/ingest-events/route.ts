// ── Centro di Città di Castello e raggio di pertinenza ──
const CDC_LAT = 43.4564
const CDC_LNG = 12.2385
const CDC_RADIUS_KM = 40

// Località valide se manca il geo (fallback testuale)
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

// Pulisce il titolo evento per ricavare un "artist_name" leggibile
function cleanTitle(name: string): string {
	return name
		.replace(/\s*[-–|]\s*biglietti.*$/i, "")
		.replace(/\s*biglietti.*$/i, "")
		.replace(/\s+in concerto.*$/i, "")
		.replace(/\s+live\b.*$/i, "")
		.trim() || name.trim()
}

// Estrae tutti gli oggetti @type:Event dal JSON-LD (gestisce anche ItemList)
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
	const m = url.match(/(\d{6,})(?:\?|$|\/)/) // id numerico Eventbrite
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

	// Cloudflare / blocco anti-bot → errore chiaro, niente silenzi
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
		const city =
			(typeof addr === "object" ? addr?.addressLocality : null) ?? null
		const addressStr =
			typeof addr === "string"
				? addr
				: [addr?.streetAddress, addr?.addressLocality, addr?.postalCode]
						.filter(Boolean)
						.join(", ") || null

		// ── Filtro geografico: tieni solo ciò che è davvero vicino ──
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

// Router delle fonti — chiamato dalla route di ingest
async function fetchSource(source: string, sourceUrl: string): Promise<any[]> {
	if (source === "eventbrite") return fetchEventbrite(sourceUrl)
	return []
}