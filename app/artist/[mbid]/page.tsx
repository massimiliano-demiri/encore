"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type Concert = {
	id: string
	date: string | null
	venue: string
	city: string
	country: string
}

export default function ArtistPage() {
	const { mbid } = useParams<{ mbid: string }>()
	const [artist, setArtist] = useState("")
	const [concerts, setConcerts] = useState<Concert[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetch("/api/artists/" + mbid + "/concerts")
			.then((r) => r.json())
			.then((d) => {
				setArtist(d.artist)
				setConcerts(d.concerts)
				setLoading(false)
			})
	}, [mbid])

	return (
		<main className="mx-auto flex max-w-md flex-col gap-4 p-6">
			<Link href="/search" className="text-sm text-muted-foreground">← Cerca</Link>
			<h1 className="text-2xl font-bold">{artist || "Artista"}</h1>
			{loading ? (
				<p>Carico i concerti…</p>
			) : concerts.length === 0 ? (
				<p>Nessun concerto trovato.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{concerts.map((c) => (
						<li key={c.id} className="rounded-lg border p-3">
							<div className="font-medium">{c.venue}</div>
							<div className="text-sm text-muted-foreground">
								{c.city}{c.country ? ", " + c.country : ""} · {c.date ?? "data sconosciuta"}
							</div>
						</li>
					))}
				</ul>
			)}
		</main>
	)
}