import { NextResponse } from "next/server"

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const mbid = searchParams.get("mbid")
	const date = searchParams.get("date") // formato yyyy-mm-dd
	if (!mbid || !date) return NextResponse.json({ songs: [] })

	// Setlist.fm vuole il formato dd-MM-yyyy
	const [y, m, d] = date.split("-")
	const sfmDate = d + "-" + m + "-" + y

	try {
		const res = await fetch(
			"https://api.setlist.fm/rest/1.0/search/setlists?artistMbid=" + mbid + "&date=" + sfmDate,
			{
				headers: {
					Accept: "application/json",
					"x-api-key": process.env.SETLISTFM_API_KEY ?? "",
				},
			},
		)
		if (!res.ok) return NextResponse.json({ songs: [] })
		const data = await res.json()
		const setlist = data.setlist?.[0]
		const sets = setlist?.sets?.set ?? []
		const songs: { name: string; encore: boolean }[] = []
		for (const s of sets) {
			const isEncore = s.encore != null
			for (const song of s.song ?? []) {
				if (song.name) songs.push({ name: song.name, encore: isEncore })
			}
		}
		return NextResponse.json({ songs })
	} catch {
		return NextResponse.json({ songs: [] })
	}
}