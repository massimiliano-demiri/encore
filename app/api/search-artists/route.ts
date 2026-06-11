import { NextResponse } from "next/server"

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const q = searchParams.get("q")?.trim()
	if (!q) return NextResponse.json({ artists: [] })

	try {
		const res = await fetch(
			"https://musicbrainz.org/ws/2/artist?query=" +
				encodeURIComponent(q) +
				"&fmt=json&limit=8",
			{
				headers: { "User-Agent": "Encore/1.0 ( m.demiri@hotmail.it )" },
			},
		)
		if (!res.ok) return NextResponse.json({ artists: [] })
		const data = await res.json()
		const artists = (data.artists ?? []).map((a: any) => ({
			mbid: a.id,
			name: a.name,
			info: a.disambiguation ?? a.country ?? "",
		}))
		return NextResponse.json({ artists })
	} catch {
		return NextResponse.json({ artists: [] })
	}
}