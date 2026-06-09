import { NextResponse } from "next/server"

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const q = searchParams.get("q")?.trim()
	if (!q) return NextResponse.json({ artists: [] })

	const url =
		"https://musicbrainz.org/ws/2/artist?query=" +
		encodeURIComponent(q) +
		"&fmt=json&limit=8"

	// MusicBrainz richiede uno User-Agent con un contatto: metti la TUA email.
	const res = await fetch(url, {
		headers: { "User-Agent": "Encore/0.1 ( tua@email.com )" },
	})
	const data = await res.json()

	const artists = (data.artists ?? []).map((a: any) => ({
		mbid: a.id,
		name: a.name,
		info: a.disambiguation ?? a.country ?? "",
	}))
	return NextResponse.json({ artists })
}