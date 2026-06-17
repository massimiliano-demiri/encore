import { NextResponse } from "next/server"

const SOURCES = [
	{ source: "eventbrite", sourceUrl: "https://www.eventbrite.it/d/italy--citt%C3%A0-di-castello/music--events/" },
]

export async function GET(request: Request) {
	const auth = request.headers.get("authorization")
	if (auth !== "Bearer " + (process.env.CRON_SECRET ?? "")) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 })
	}
	const origin = new URL(request.url).origin
	const results: any[] = []
	for (const s of SOURCES) {
		try {
			const r = await fetch(origin + "/api/ingest-events", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(s),
			})
			results.push({ source: s.source, status: r.status, body: await r.json() })
		} catch (err) {
			results.push({ source: s.source, error: String(err) })
		}
	}
	return NextResponse.json({ ran: results })
}