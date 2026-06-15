import { NextResponse } from "next/server"

const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY ?? ""

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const lat = searchParams.get("lat")
	const lng = searchParams.get("lng")
	const radius = searchParams.get("radius") ?? "100"
	const keyword = searchParams.get("keyword")
	const unit = "km"

	if (!TICKETMASTER_KEY) { return NextResponse.json({ events: [] }) }

	let url: string
	if (keyword) {
		url = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=" +
			TICKETMASTER_KEY + "&keyword=" + encodeURIComponent(keyword) +
			"&classificationName=music&size=15&sort=date,asc"
	} else if (lat && lng) {
		url = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=" +
			TICKETMASTER_KEY + "&latlong=" + lat + "," + lng +
			"&radius=" + radius + "&unit=" + unit +
			"&classificationName=music&size=40&sort=date,asc"
	} else {
		url = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=" +
			TICKETMASTER_KEY + "&countryCode=IT&classificationName=music&size=30&sort=date,asc"
	}

	try {
		const res = await fetch(url)
		if (!res.ok) return NextResponse.json({ events: [] })
		const data = await res.json()
		return NextResponse.json({ events: formatEvents(data) })
	} catch { return NextResponse.json({ events: [] }) }
}

function formatEvents(data: any) {
	const embedded = data._embedded
	if (!embedded?.events) return []

	return embedded.events.map((e: any) => {
		const venue = e._embedded?.venues?.[0] ?? {}
		const date = e.dates?.start?.dateTime ?? e.dates?.start?.localDate ?? null
		const isoDate = date ? date.slice(0, 10) : null
		const name = e.name ?? e._embedded?.attractions?.[0]?.name ?? "Artista"
		const priceMin = e.priceRanges?.[0]?.min ?? null
		const priceCurrency = e.priceRanges?.[0]?.currency ?? null

		return {
			id: e.id,
			date: isoDate,
			artistName: name,
			artistMbid: null,
			venueName: venue.name ?? "",
			city: venue.city?.name ?? "",
			country: venue.country?.name ?? "",
			lat: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
			lng: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
			imageUrl: e.images?.[0]?.url ?? null,
			ticketUrl: e.url ?? null,
			priceMin,
			priceCurrency,
		}
	})
}