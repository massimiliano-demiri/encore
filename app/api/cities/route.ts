import { NextResponse } from "next/server"

let cache: string[] | null = null

async function getAllCities(): Promise<string[]> {
	if (cache) return cache
	try {
		const res = await fetch(
			"https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv",
		)
		if (!res.ok) return []
		const csv = await res.text()
		const lines = csv.split("\n").slice(1) // salta header
		const cities = new Set<string>()
		for (const line of lines) {
			// Formato CSV ISTAT: codice regione;...;denominazione italiana;...
			const cols = line.split(";")
			if (cols.length < 6) continue
			const name = cols[5]?.trim()
			if (name && name.length > 1) cities.add(name)
		}
		const sorted = [...cities].sort((a, b) => a.localeCompare(b, "it"))
		cache = sorted
		return sorted
	} catch {
		return []
	}
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const q = searchParams.get("q")?.trim().toLowerCase() ?? ""

	const all = await getAllCities()
	if (!q || q.length < 2) return NextResponse.json({ cities: all.slice(0, 50) })

	const matches = all.filter((c) => c.toLowerCase().includes(q)).slice(0, 20)
	return NextResponse.json({ cities: matches })
}   