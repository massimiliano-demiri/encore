import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY ?? ""

async function fetchTicketmasterEvents(artistName: string): Promise<any[]> {
	if (!TICKETMASTER_KEY) return []
	try {
		const url =
			"https://app.ticketmaster.com/discovery/v2/events.json?apikey=" +
			TICKETMASTER_KEY +
			"&keyword=" +
			encodeURIComponent(artistName) +
			"&classificationName=music&size=10&sort=date,asc"
		const res = await fetch(url)
		if (!res.ok) return []
		const data = await res.json()
		const embedded = data._embedded
		if (!embedded?.events) return []

		return embedded.events.map((e: any) => {
			const venue = e._embedded?.venues?.[0] ?? {}
			const date = e.dates?.start?.dateTime ?? e.dates?.start?.localDate ?? null
			const isoDate = date ? date.slice(0, 10) : null
			const name = e.name ?? e._embedded?.attractions?.[0]?.name ?? artistName

			return {
				id: e.id,
				date: isoDate,
				venue: venue.name ?? "",
				city: venue.city?.name ?? "",
				country: venue.country?.name ?? "",
				lat: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
				lng: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
				imageUrl: e.images?.[0]?.url ?? null,
				source: "ticketmaster",
			}
		})
	} catch {
		return []
	}
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ mbid: string }> },
) {
	const { mbid } = await params
	const { searchParams } = new URL(_request.url)
	const page = parseInt(searchParams.get("p") ?? "1", 10) || 1

	// Nome artista lo prendiamo dal DB prima delle chiamate
	let artistName = ""

	try {
		const setlistUrl = "https://api.setlist.fm/rest/1.0/artist/" + mbid + "/setlists?p=" + page
		const res = await fetch(setlistUrl, {
			headers: {
				"x-api-key": process.env.SETLISTFM_API_KEY ?? "",
				Accept: "application/json",
			},
		})

		if (!res.ok && page === 1) {
			return NextResponse.json({ artist: "", concerts: [], upcoming: [], page: 1, total: 0 })
		}

		const data = res.ok ? await res.json() : { setlist: [], total: 0, itemsPerPage: 20 }
		const setlists = data.setlist ?? []
		const total = data.total ?? 0
		const itemsPerPage = data.itemsPerPage ?? 20

		artistName = setlists[0]?.artist?.name ?? ""

		const supabaseAdmin = getSupabaseAdmin()

		// === Ticketmaster fetch (solo pagina 1) ===
		let upcomingConcerts: any[] = []
		if (page === 1 && artistName) {
			const tmEvents = await fetchTicketmasterEvents(artistName)
			if (supabaseAdmin && tmEvents.length > 0) {
				// Upsert artist
				const { data: artRow } = await supabaseAdmin
					.from("artists").select("id").eq("mbid", mbid).maybeSingle()
				const artistId = artRow?.id ?? null

				for (const ev of tmEvents) {
					try {
						// Upsert venue
						let venueId: string | null = null
						if (ev.venue) {
							const venueKey = ev.venue + "|" + ev.city
							const { data: vRow } = await supabaseAdmin
								.from("venues")
								.select("id")
								.eq("name", ev.venue)
								.eq("city", ev.city)
								.maybeSingle()
							if (vRow) {
								venueId = vRow.id
							} else {
								const { data: newV } = await supabaseAdmin
									.from("venues")
									.insert({
										name: ev.venue,
										city: ev.city,
										country: ev.country,
										lat: ev.lat,
										lng: ev.lng,
									})
									.select("id")
									.single()
								venueId = newV?.id ?? null
							}
						}

						// Upsert concert (usa TM id come setlistfm_id per dedup)
						const { data: cRow } = await supabaseAdmin
							.from("concerts")
							.upsert({
								setlistfm_id: ev.id,
								artist_id: artistId,
								venue_id: venueId,
								date: ev.date,
								tour_name: null,
							}, { onConflict: "setlistfm_id" })
							.select("id")
							.single()

						upcomingConcerts.push({
							id: cRow?.id ?? ev.id,
							date: ev.date,
							venue: ev.venue,
							city: ev.city,
							country: ev.country,
							source: "ticketmaster",
						})
					} catch { /* skip single upsert failures */ }
				}
			} else {
				// Senza Supabase admin, restituisco grezzi
				upcomingConcerts = tmEvents
			}
		}

		// === Setlist.fm (storico) ===
		if (!supabaseAdmin) {
			const concerts = setlists.map((s: any) => ({
				id: s.id,
				date: toIso(s.eventDate),
				venue: s.venue?.name ?? "Venue sconosciuta",
				city: s.venue?.city?.name ?? "",
				country: s.venue?.city?.country?.name ?? "",
				source: "setlistfm",
			}))
			return NextResponse.json({
				artist: artistName,
				concerts,
				upcoming: upcomingConcerts,
				page,
				total,
				itemsPerPage,
			})
		}

		// Salva artista
		if (setlists[0]?.artist) {
			await supabaseAdmin
				.from("artists")
				.upsert(
					{ mbid: setlists[0].artist.mbid, name: setlists[0].artist.name },
					{ onConflict: "mbid" },
				)
		}

		const { data: artistRow } = await supabaseAdmin
			.from("artists").select("id").eq("mbid", mbid).maybeSingle()

		const concerts = []
		for (const s of setlists) {
			const v = s.venue
			let venueId: string | null = null

			if (v?.id) {
				await supabaseAdmin.from("venues").upsert({
					setlistfm_id: v.id,
					name: v.name,
					city: v.city?.name ?? null,
					country: v.city?.country?.name ?? null,
					lat: v.city?.coords?.lat ?? null,
					lng: v.city?.coords?.long ?? null,
				}, { onConflict: "setlistfm_id" })

				const { data: venueRow } = await supabaseAdmin
					.from("venues").select("id").eq("setlistfm_id", v.id).maybeSingle()
				venueId = venueRow?.id ?? null
			}

			const isoDate = toIso(s.eventDate)

			const { data: concertRow } = await supabaseAdmin
				.from("concerts")
				.upsert({
					setlistfm_id: s.id,
					artist_id: artistRow?.id ?? null,
					venue_id: venueId,
					date: isoDate,
					tour_name: s.tour?.name ?? null,
				}, { onConflict: "setlistfm_id" })
				.select("id")
				.single()

			concerts.push({
				id: concertRow?.id ?? s.id,
				date: isoDate,
				venue: v?.name ?? "Venue sconosciuta",
				city: v?.city?.name ?? "",
				country: v?.city?.country?.name ?? "",
				source: "setlistfm",
			})
		}

		return NextResponse.json({
		artist: artistName || (setlists[0]?.artist?.name ?? ""),
			concerts,
			upcoming: upcomingConcerts,
			page,
			total,
			itemsPerPage,
		})
	} catch (err) {
		console.error("Setlist.fm error:", err)
		return NextResponse.json({ artist: artistName, concerts: [], upcoming: [], page: 1, total: 0 })
	}
}

function toIso(eventDate: string | undefined): string | null {
	if (!eventDate) return null
	const parts = eventDate.split("-")
	if (parts.length !== 3) return null
	return parts[2] + "-" + parts[1] + "-" + parts[0]
}