import { NextResponse } from "next/server"

const FANART_KEY = process.env.FANARTTV_API_KEY ?? "88eba8a755ab91f1db2b5316b252833e"

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const mbid = searchParams.get("mbid")
	const q = searchParams.get("q")

	if (mbid) {
		try {
			const res = await fetch(
				"https://webservice.fanart.tv/v3/music/" + mbid + "?api_key=" + FANART_KEY,
				{ next: { revalidate: 60 * 60 * 24 } },
			)
			if (res.ok) {
				const data = await res.json()
				const thumbs = (data.artistthumb ?? []) as Array<{ url: string }>
				const backgrounds = (data.artistbackground ?? []) as Array<{ url: string }>
				const best = thumbs[0]?.url ?? backgrounds[0]?.url ?? null
				if (best) {
					const response = NextResponse.json({ image: best, source: "fanart" })
					response.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400")
					return response
				}
			}
		} catch { /* fallback */ }
	}

	if (q) {
		try {
			const res = await fetch(
				"https://itunes.apple.com/search?entity=album&limit=1&term=" + encodeURIComponent(q),
			)
			const data = await res.json()
			const raw = data.results?.[0]?.artworkUrl100 as string | undefined
			const image = raw ? raw.replace("100x100bb", "600x600bb") : null
			const response = NextResponse.json({ image, source: image ? "itunes" : null })
			response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600")
			return response
		} catch {
			return NextResponse.json({ image: null, source: null })
		}
	}

	return NextResponse.json({ image: null, source: null })
}