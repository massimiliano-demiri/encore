import { NextResponse } from "next/server"

const SETLISTFM_KEY = process.env.SETLISTFM_API_KEY ?? ""

async function fetchCity(city: string): Promise<any[]> {
	if (!SETLISTFM_KEY) return []
	try {
		const url =
			"https://api.setlist.fm/rest/1.0/search/setlists?cityName=" +
			encodeURIComponent(city) + "&p=1"
		const res = await fetch(url, {
			headers: { "x-api-key": SETLISTFM_KEY, Accept: "application/json" },
		})
		if (!res.ok) return []
		const data = await res.json()
		return (data.setlist ?? []).map((s: any) => ({
			id: s.id,
			date: toIso(s.eventDate),
			artistName: s.artist?.name ?? "Artista",
			artistMbid: s.artist?.mbid ?? null,
			venueName: s.venue?.name ?? "",
			city: s.venue?.city?.name ?? "",
			country: s.venue?.city?.country?.name ?? "",
			lat: s.venue?.city?.coords?.lat ?? null,
			lng: s.venue?.city?.coords?.long ?? null,
		}))
	} catch {
		return []
	}
}

function toIso(d: string | undefined): string | null {
	if (!d) return null
	const parts = d.split("-")
	if (parts.length !== 3) return null
	return parts[2] + "-" + parts[1] + "-" + parts[0]
}

// Città italiane "vicine" per riempire la mappa quando l'utente è in una zona
const NEARBY_CITIES: Record<string, string[]> = {
	firenze: ["Bologna", "Pisa", "Prato", "Siena"],
	milano: ["Bergamo", "Brescia", "Como", "Pavia", "Monza"],
	roma: ["Latina", "Tivoli", "Viterbo", "Frosinone"],
	napoli: ["Salerno", "Caserta", "Pompei", "Avellino"],
	torino: ["Asti", "Cuneo", "Novara", "Alessandria"],
	bologna: ["Modena", "Ferrara", "Imola", "Reggio Emilia"],
	venezia: ["Padova", "Treviso", "Vicenza", "Verona"],
	bari: ["Lecce", "Taranto", "Brindisi", "Foggia"],
	palermo: ["Catania", "Messina", "Trapani", "Agrigento"],
	genova: ["Savona", "La Spezia", "Imperia", "Sanremo"],
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const city = searchParams.get("city")?.trim()

	if (!SETLISTFM_KEY) return NextResponse.json({ concerts: [] })

	// Fetch la città principale + città vicine
	const citiesToFetch = new Set<string>()
	if (city) {
		citiesToFetch.add(city)
		const key = city.toLowerCase()
		for (const [k, v] of Object.entries(NEARBY_CITIES)) {
			if (key === k || key.includes(k) || k.includes(key)) {
				for (const c of v.slice(0, 3)) citiesToFetch.add(c)
				break
			}
		}
	}
	// Fallback: se nessuna città o non riconosciuta, fetch Italia generico
	if (citiesToFetch.size === 0) {
		citiesToFetch.add("Milano")
		citiesToFetch.add("Roma")
		citiesToFetch.add("Bologna")
	}

	const results = await Promise.all([...citiesToFetch].map(fetchCity))
	const all = results.flat()

	// Dedup
	const seen = new Set<string>()
	const deduped = all.filter((c: any) => {
		const key = c.artistName + "|" + c.venueName + "|" + c.date
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})

	return NextResponse.json({ concerts: deduped })
}