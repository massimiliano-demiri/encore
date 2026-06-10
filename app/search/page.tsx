"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArtistImage } from "@/components/artsit-image"

type Artist = { mbid: string; name: string; info: string }

function SearchInner() {
	const params = useSearchParams()
	const initial = params.get("q") ?? ""
	const [q, setQ] = useState(initial)
	const [artists, setArtists] = useState<Artist[]>([])
	const [loading, setLoading] = useState(false)

	const search = async (term: string) => {
		if (!term.trim()) return
		setLoading(true)
		const res = await fetch("/api/search-artists?q=" + encodeURIComponent(term))
		const data = await res.json()
		setArtists(data.artists)
		setLoading(false)
	}

	useEffect(() => {
		if (initial) search(initial)
	}, [initial])

	return (
		<main className="mx-auto flex max-w-md flex-col gap-4 p-6">
			<h1 className="text-2xl font-bold">Cerca un artista</h1>
			<div className="flex gap-2">
				<Input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Es. Radiohead"
					onKeyDown={(e) => e.key === "Enter" && search(q)}
				/>
				<Button onClick={() => search(q)}>Cerca</Button>
			</div>
			{loading && <p>Cerco…</p>}
			<ul className="flex flex-col gap-2">
				{artists.map((a) => (
					<li key={a.mbid} className="flex items-center gap-3 rounded-lg border p-2">
	<ArtistImage name={a.name} className="h-12 w-12 shrink-0 rounded-md" />
	<Link href={"/artist/" + a.mbid} className="font-medium hover:underline">
		{a.name}
	</Link>
</li>
				))}
			</ul>
		</main>
	)
}

export default function SearchPage() {
	return (
		<Suspense fallback={<main className="p-6">Carico…</main>}>
			<SearchInner />
		</Suspense>
	)
}