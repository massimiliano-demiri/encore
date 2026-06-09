"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Artist = { mbid: string; name: string; info: string }

export default function SearchPage() {
	const [q, setQ] = useState("")
	const [artists, setArtists] = useState<Artist[]>([])
	const [loading, setLoading] = useState(false)

	const search = async () => {
		setLoading(true)
		const res = await fetch("/api/search-artists?q=" + encodeURIComponent(q))
		const data = await res.json()
		setArtists(data.artists)
		setLoading(false)
	}

	return (
		<main className="mx-auto flex max-w-md flex-col gap-4 p-6">
			<h1 className="text-2xl font-bold">Cerca un artista</h1>
			<div className="flex gap-2">
				<Input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Es. Radiohead"
					onKeyDown={(e) => e.key === "Enter" && search()}
				/>
				<Button onClick={search}>Cerca</Button>
			</div>
			{loading && <p>Cerco…</p>}
			<ul className="flex flex-col gap-2">
				{artists.map((a) => (
					<li key={a.mbid}>
						<Link href={"/artist/" + a.mbid} className="block rounded-lg border p-3 hover:bg-muted">
							<span className="font-medium">{a.name}</span>
							{a.info && <span className="text-muted-foreground"> — {a.info}</span>}
						</Link>
					</li>
				))}
			</ul>
		</main>
	)
}