import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ mbid: string }> },
) {
	const { mbid } = await params

	const url = "https://api.setlist.fm/rest/1.0/artist/" + mbid + "/setlists?p=1"
	const res = await fetch(url, {
		headers: {
			"x-api-key": process.env.SETLISTFM_API_KEY!,
			Accept: "application/json",
		},
	})
	if (!res.ok) return NextResponse.json({ artist: "", concerts: [] })

	const data = await res.json()
	const setlists = data.setlist ?? []

	// 1) Salva/aggiorna l'artista
	const first = setlists[0]
	if (first?.artist) {
		await supabaseAdmin
			.from("artists")
			.upsert({ mbid: first.artist.mbid, name: first.artist.name }, { onConflict: "mbid" })
	}
	const { data: artistRow } = await supabaseAdmin
		.from("artists").select("id").eq("mbid", mbid).single()

	const concerts = []
	for (const s of setlists) {
		const v = s.venue
		let venueId = null

		// 2) Salva/aggiorna la venue
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
				.from("venues").select("id").eq("setlistfm_id", v.id).single()
			venueId = venueRow?.id ?? null
		}

		// La data di Setlist.fm è in formato gg-mm-aaaa: la converto in aaaa-mm-gg
		const [dd, mm, yyyy] = (s.eventDate ?? "").split("-")
		const isoDate = yyyy ? yyyy + "-" + mm + "-" + dd : null

		// 3) Salva/aggiorna il concerto
		const { data: concertRow } = await supabaseAdmin.from("concerts").upsert({
			setlistfm_id: s.id,
			artist_id: artistRow?.id ?? null,
			venue_id: venueId,
			date: isoDate,
			tour_name: s.tour?.name ?? null,
		}, { onConflict: "setlistfm_id" }).select("id").single()

		concerts.push({
			id: concertRow?.id ?? s.id,
			date: isoDate,
			venue: v?.name ?? "Venue sconosciuta",
			city: v?.city?.name ?? "",
			country: v?.city?.country?.name ?? "",
		})
	}

	return NextResponse.json({ artist: first?.artist?.name ?? "", concerts })
}