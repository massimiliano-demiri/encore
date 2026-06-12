import { NextResponse } from "next/server"

const SETLISTFM_KEY = process.env.SETLISTFM_API_KEY ?? ""

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const city = searchParams.get("city")?.trim()
	const lat = searchParams.get("lat")
	const lng = searchParams.get("lng")

	if (!SETLISTFM_KEY) return NextResponse.json({ concerts: [] })

	try {
		let url: string
		// Setlist.fm supporta ricerca per cityName o lat/lng
		if (city) {
			url = "https://api.setlist.fm/rest/1.0/search/setlists?cityName=" +
				encodeURIComponent(city) + "&p=1"
		} else if (lat && lng) {
			url = "https://api.setlist.fm/rest/1.0/search/setlists?p=1"
			// Setlist.fm non supporta filtri lat/lng diretti, usiamo city dal geocoding
			// Fallback: cerchiamo in Italia per default
			url = "https://api.setlist.fm/rest/1.0/search/setlists?countryCode=IT&p=1"
		} else {
			url = "https://api.setlist.fm/rest/1.0/search/setlists?countryCode=IT&p=1"
		}

		const res = await fetch(url, {
			headers: {
				"x-api-key": SETLISTFM_KEY,
				Accept: "application/json",
			},
		})
		if (!res.ok) return NextResponse.json({ concerts: [] })

		const data = await res.json()
		const setlists = (data.setlist ?? []).map((s: any) => {
			const dd = s.eventDate?.split("-") ?? []
			const isoDate = dd.length === 3 ? dd[2] + "-" + dd[1] + "-" + dd[0] : null
			return {
				id: s.id,
				date: isoDate,
				artistName: s.artist?.name ?? "Artista",
				artistMbid: s.artist?.mbid ?? null,
				venueName: s.venue?.name ?? "Venue sconosciuta",
				city: s.venue?.city?.name ?? "",
				country: s.venue?.city?.country?.name ?? "",
				lat: s.venue?.city?.coords?.lat ?? null,
				lng: s.venue?.city?.coords?.long ?? null,
				tourName: s.tour?.name ?? null,
			}
		})

		// Dedup per venue+date (Setlist.fm spesso ha duplicati)
		const seen = new Set<string>()
		const deduped = setlists.filter((c: any) => {
			const key = c.venueName + "|" + c.date
			if (seen.has(key)) return false
			seen.add(key)
			return true
		})

		return NextResponse.json({ concerts: deduped })
	} catch {
		return NextResponse.json({ concerts: [] })
	}
}