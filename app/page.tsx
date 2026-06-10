"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ConcertPoster } from "@/components/concert-poster"

type FeedItem = {
	id: string
	rating: number | null
	concert_id: string
	concerts: { artists: { name: string } | null; venues: { city: string | null } | null } | null
}

export default function Home() {
	const router = useRouter()
	const supabase = createClient()
	const [q, setQ] = useState("")
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

	const search = (e: React.FormEvent) => {
		e.preventDefault()
		if (q.trim()) router.push("/search?q=" + encodeURIComponent(q.trim()))
	}

	return (
		<main>
			<section className="mx-auto max-w-3xl px-6 py-16 text-center">
				<h1 className="text-5xl font-bold tracking-tight [font-family:var(--font-display)]">
					Ogni live, per sempre.
				</h1>
				<p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
					Tieni traccia dei concerti che hai visto, dai un voto, scrivi due righe. E scopri quelli degli altri.
				</p>
				<form onSubmit={search} className="mx-auto mt-8 flex max-w-md gap-2">
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Cerca un artista…"
						className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 outline-none focus:border-[#FF2D6B]"
					/>
					<button className="rounded-full bg-[#FF2D6B] px-5 py-2 font-medium text-white">Cerca</button>
				</form>
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