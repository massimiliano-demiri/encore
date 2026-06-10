import { NextResponse } from "next/server"

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const q = searchParams.get("q")
	if (!q) return NextResponse.json({ image: null })

	try {
		const res = await fetch(
			"https://itunes.apple.com/search?entity=album&limit=1&term=" + encodeURIComponent(q),
		)
		const data = await res.json()
		const raw = data.results?.[0]?.artworkUrl100 as string | undefined
		const image = raw ? raw.replace("100x100bb", "600x600bb") : null
		return NextResponse.json({ image })
	} catch {
		return NextResponse.json({ image: null })
	}
}