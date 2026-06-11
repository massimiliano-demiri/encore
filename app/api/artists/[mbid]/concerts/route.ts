import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ mbid: string }> },
) {
	const { mbid } = await params

	try {
		const url = "https://api.setlist.fm/rest/1.0/artist/" + mbid + "/setlists?p=1"
		const res = await fetch(url, {
			headers: {
				"x-api-key": process.env.SETLISTFM_API_KEY ?? "",
				Accept: "application/json",
			},
		})
		if (!res.ok) return NextResponse.json({ artist: "", concerts: [] })

		const data = await res.json()
		const setlists = data.setlist ?? []

		const supabaseAdmin = getSupabaseAdmin()
		if (!supabaseAdmin) {
			// Senza Supabase admin, restituisco i concerti grezzi senza salvarli
			const first = setlists[0]
			const concerts = setlists.map((s: any) => ({
				id: s.id,
				date: toIso(s.eventDate),
				venue: s.venue?.name ?? "Venue sconosciuta",
				city: s.venue?.city?.name ?? "",
				country: s.venue?.city?.country?.name ?? "",
			}))
			return NextResponse.json({ artist: first?.artist?.name ?? "", concerts })
		}

		// 1) Salva/aggiorna l'artista
		const first = setlists[0]
		if (first?.artist) {
			await supabaseAdmin
				.from("artists")
				.upsert({ mbid: first.artist.mbid, name: first.artist.name }, { onConflict: "mbid" })
		}

		const { data: artistRow } = await supabaseAdmin
			.from("artists").select("id").eq("mbid", mbid).maybeSingle()

		const concerts = []
		for (const s of setlists) {
			const v = s.venue
			let venueId: string | null = null

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
					.from("venues").select("id").eq("setlistfm_id", v.id).maybeSingle()
				venueId = venueRow?.id ?? null
			}

			const isoDate = toIso(s.eventDate)

			// 3) Salva/aggiorna il concerto
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
			})
		}

		return NextResponse.json({ artist: first?.artist?.name ?? "", concerts })
	} catch (err) {
		console.error("Setlist.fm error:", err)
		return NextResponse.json({ artist: "", concerts: [] })
	}
}

function toIso(eventDate: string | undefined): string | null {
	if (!eventDate) return null
	const parts = eventDate.split("-")
	if (parts.length !== 3) return null
	return parts[2] + "-" + parts[1] + "-" + parts[0]
}