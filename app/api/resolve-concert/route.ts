import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY ?? ""

function getAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) return null
	return createClient(url, key)
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const id = searchParams.get("id")?.trim()
	if (!id) return NextResponse.json(null)

	const admin = getAdmin()
	if (!admin) return NextResponse.json(null)

	// 1) Prova UUID
	let { data } = await admin.from("concerts").select("id").eq("id", id).maybeSingle()
	if (data) return NextResponse.json({ concertId: (data as any).id })

	// 2) Prova setlistfm_id
	const bySfid = await admin.from("concerts").select("id").eq("setlistfm_id", id).maybeSingle()
	if (bySfid.data) return NextResponse.json({ concertId: (bySfid.data as any).id })

	// 3) Ticketmaster fallback — fetch evento per ID
	if (TICKETMASTER_KEY && !id.includes("-")) {
		try {
			const tmUrl = "https://app.ticketmaster.com/discovery/v2/events/" + encodeURIComponent(id) + ".json?apikey=" + TICKETMASTER_KEY
			const tmRes = await fetch(tmUrl)
			if (tmRes.ok) {
				const tmData = await tmRes.json()
				const name = tmData.name ?? tmData._embedded?.attractions?.[0]?.name ?? "Artista"
				const venue = tmData._embedded?.venues?.[0] ?? {}
				const date = tmData.dates?.start?.dateTime ?? tmData.dates?.start?.localDate ?? null
				const isoDate = date ? date.slice(0, 10) : null

				// Salva artista
				const { data: artRow } = await admin.from("artists").select("id, mbid, name").eq("name", name).maybeSingle()
				const artistId = artRow?.id ?? (await admin.from("artists").insert({ name }).select("id").single()).data?.id

				// Salva venue
				const vName = venue.name ?? ""
				const vCity = venue.city?.name ?? ""
				const { data: vRow } = await admin.from("venues").select("id").eq("name", vName).eq("city", vCity).maybeSingle()
				const venueId = vRow?.id ?? (await admin.from("venues").insert({
					name: vName,
					city: vCity,
					country: venue.country?.name ?? "",
					lat: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
					lng: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
				}).select("id").single()).data?.id

				// Salva concerto
				const { data: concertRow } = await admin.from("concerts").upsert({
					setlistfm_id: id,
					artist_id: artistId ?? null,
					venue_id: venueId ?? null,
					date: isoDate,
				}, { onConflict: "setlistfm_id" }).select("id").single()

				if (concertRow) return NextResponse.json({ concertId: concertRow.id })
			}
		} catch { /* ignore */ }
	}

	return NextResponse.json(null)
}