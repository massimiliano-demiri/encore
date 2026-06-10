"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ConcertPoster } from "@/components/concert-poster"
import { ArtistSearch } from "@/components/artist-search"

type FeedItem = {
	id: string
	rating: number | null
	concert_id: string
	concerts: { artists: { name: string } | null; venues: { city: string | null } | null } | null
}

export default function Home() {
	const supabase = createClient()
	const [recent, setRecent] = useState<FeedItem[]>([])

	useEffect(() => {
		supabase
			.from("logs")
			.select("id, rating, concert_id, concerts(artists(name), venues(city))")
			.not("review", "is", null)
			.order("logged_at", { ascending: false })
			.limit(6)
			.then(({ data }) => setRecent((data as unknown as FeedItem[]) ?? []))
	}, [])

	return (
		<main>
			<section className="mx-auto max-w-3xl px-6 py-16 text-center">
				<h1 className="text-5xl font-bold tracking-tight [font-family:var(--font-display)]">
					Ogni live, per sempre.
				</h1>
				<p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
					Tieni traccia dei concerti che hai visto, dai un voto, scrivi due righe. E scopri quelli degli altri.
				</p>
				<div className="mx-auto mt-8 flex max-w-md justify-center">
					<ArtistSearch />
				</div>
			</section>

			{recent.length > 0 && (
				<section className="mx-auto max-w-3xl px-6 pb-16">
					<h2 className="mb-3 font-semibold">Ultimi live raccontati</h2>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
						{recent.map((it) => (
							<ConcertPoster
								key={it.id}
								concertId={it.concert_id}
								artist={it.concerts?.artists?.name ?? "Artista"}
								rating={it.rating}
								subtitle={it.concerts?.venues?.city ?? ""}
							/>
						))}
					</div>
				</section>
			)}
		</main>
	)
}