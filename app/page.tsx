"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Star, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ConcertPoster } from "@/components/concert-poster"
import { ArtistSearch } from "@/components/artist-search"

type FeedItem = {
	id: string
	rating: number | null
	concert_id: string
	concerts: { artists: { name: string } | null; venues: { city: string | null } | null } | null
}

const steps = [
	{ Icon: Search, title: "Cerca il live", text: "Trova l'artista e la data del concerto a cui sei stato." },
	{ Icon: Star, title: "Vota e racconta", text: "Dai un voto, scrivi due righe, aggiungi foto e scaletta." },
	{ Icon: Users, title: "Scopri gli altri", text: "Segui gli amici, leggi le loro recensioni, costruisci il tuo diario." },
]

export default function Home() {
	const supabase = createClient()
	const [recent, setRecent] = useState<FeedItem[]>([])
	const [loggedIn, setLoggedIn] = useState(false)
	const [counts, setCounts] = useState({ logs: 0, users: 0 })

	useEffect(() => {
		const load = async () => {
			const { data: auth } = await supabase.auth.getUser()
			setLoggedIn(!!auth.user)

			const { data } = await supabase
				.from("logs")
				.select("id, rating, concert_id, concerts(artists(name), venues(city))")
				.not("review", "is", null)
				.order("logged_at", { ascending: false })
				.limit(6)
			setRecent((data as unknown as FeedItem[]) ?? [])

			const [logsRes, usersRes] = await Promise.all([
				supabase.from("logs").select("*", { count: "exact", head: true }),
				supabase.from("profiles").select("*", { count: "exact", head: true }),
			])
			setCounts({ logs: logsRes.count ?? 0, users: usersRes.count ?? 0 })
		}
		load()
	}, [])

	return (
		<main>
			<section className="relative overflow-hidden px-6 pt-24 pb-14 text-center">
				<div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-[#FF2D6B]/20 blur-[130px]" />
				<div className="mx-auto max-w-3xl">
					<span className="inline-block rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-widest text-white/60">
						Il diario dei concerti
					</span>
					<h1 className="mt-5 text-6xl font-bold tracking-tight [font-family:var(--font-display)]">
						Enc<span className="text-[#FF2D6B]">o</span>re
					</h1>
					<p className="mt-3 text-2xl font-semibold text-white/90 [font-family:var(--font-display)]">
						Ogni live, per sempre.
					</p>
					<p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
						Vota i concerti che hai visto, conserva scalette e foto, e scopri i live di chi la pensa come te.
					</p>
					<div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3">
						<ArtistSearch />
						{loggedIn ? (
							<Link href="/me" className="text-sm text-white/60 hover:text-white">
								Vai al tuo diario →
							</Link>
						) : (
							<Link href="/login" className="inline-flex rounded-full bg-[#FF2D6B] px-6 py-3 font-medium text-white transition hover:brightness-110">
								Inizia gratis
							</Link>
						)}
					</div>
					{(counts.logs > 0 || counts.users > 0) && (
						<p className="mt-6 text-sm text-white/40">
							{counts.logs} live raccontati · {counts.users} appassionati
						</p>
					)}
				</div>
			</section>

			<section className="mx-auto max-w-4xl px-6 py-12">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{steps.map((s) => (
						<div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
							<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF2D6B]/15 text-[#FF2D6B]">
								<s.Icon className="h-5 w-5" />
							</div>
							<h3 className="mt-4 font-semibold">{s.title}</h3>
							<p className="mt-1.5 text-sm text-white/55">{s.text}</p>
						</div>
					))}
				</div>
			</section>

			{recent.length > 0 && (
				<section className="mx-auto max-w-3xl px-6 py-12">
					<h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-white/50">Ultimi live raccontati</h2>
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

			{!loggedIn && (
				<section className="mx-auto max-w-3xl px-6 py-16">
					<div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#FF2D6B]/15 to-[#7A5CFF]/15 p-10 text-center">
						<h2 className="text-3xl font-bold [font-family:var(--font-display)]">
							Quanti concerti hai già dimenticato?
						</h2>
						<p className="mx-auto mt-3 max-w-md text-white/60">
							Inizia oggi a tenere il diario dei tuoi live. Ci vogliono trenta secondi.
						</p>
						<Link href="/login" className="mt-6 inline-flex rounded-full bg-[#FF2D6B] px-6 py-3 font-medium text-white transition hover:brightness-110">
							Crea il tuo diario
						</Link>
					</div>
				</section>
			)}
		</main>
	)
}