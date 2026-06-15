"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ConcertPoster } from "@/components/concert-poster"
import { ArtistImage } from "@/components/artsit-image"
import NearbyPage from "./nearby/page"

type FeedItem = {
	id: string
	rating: number | null
	review: string | null
	logged_at: string
	concert_id: string
	profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null
	concerts: {
		date: string | null
		artists: { name: string; mbid: string | null } | null
		venues: { name: string; city: string | null } | null
	} | null
}

type ListRow = { id: string; title: string; description: string | null; user_id: string }

export default function Home() {
	const { user, loading: userLoading } = useUser()
	const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
	const [feed, setFeed] = useState<FeedItem[]>([])
	const [popular, setPopular] = useState<FeedItem[]>([])
	const [lists, setLists] = useState<ListRow[]>([])
	const [counts, setCounts] = useState({ logs: 0, users: 0 })
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
			setSupabase(createClient())
		}
	}, [])

	useEffect(() => {
		if (!supabase) { setLoading(false); return }
		const load = async () => {
			const [
				{ data: recent },
				{ data: top },
				{ data: ls },
				logsRes,
				usersRes,
			] = await Promise.all([
				supabase
					.from("logs")
					.select("id, rating, review, logged_at, concert_id, profiles(username, display_name, avatar_url), concerts(date, artists(name, mbid), venues(name, city))")
					.not("review", "is", null)
					.order("logged_at", { ascending: false })
					.limit(8),
				supabase
					.from("logs")
					.select("id, rating, review, concert_id, concerts(artists(name), venues(city))")
					.not("rating", "is", null)
					.order("logged_at", { ascending: false })
					.limit(12),
				supabase
					.from("lists")
					.select("id, title, description, user_id")
					.eq("is_public", true)
					.order("created_at", { ascending: false })
					.limit(6),
				supabase.from("logs").select("*", { count: "exact", head: true }),
				supabase.from("profiles").select("*", { count: "exact", head: true }),
			])
			setFeed((recent as unknown as FeedItem[]) ?? [])
			setPopular((top as unknown as FeedItem[]) ?? [])
			setLists((ls as unknown as ListRow[]) ?? [])
			setCounts({ logs: logsRes.count ?? 0, users: usersRes.count ?? 0 })
			setLoading(false)
		}
		load()
	}, [supabase])

	// Non loggato → atterra direttamente sul radar/mappa
	if (!userLoading && !user) {
		return <NearbyPage />
	}

	if (loading || userLoading) return null

	return (
		<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
			<div className="mb-10">
				<p className="text-2xl font-bold leading-snug sm:text-3xl [font-family:var(--font-display)]">
					Bentornat{user?.user_metadata?.display_name ? "a" : "o"}.
				</p>
				<p className="mt-1.5 max-w-lg text-base text-white/45 sm:text-lg">
					Ecco cosa succede nel tuo diario.
				</p>
			</div>

			{popular.length > 0 && (
				<section className="mb-14">
					<div className="mb-5 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-px w-6 bg-white/10" />
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
								I più votati
							</span>
						</div>
						<Link href="/search" className="text-xs uppercase tracking-wider text-white/30 hover:text-[#FFC24B] transition">
							Cerca un artista →
						</Link>
					</div>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
						{popular.map((it) => (
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

			{feed.length > 0 && (
				<section className="mb-14">
					<div className="mb-5 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-px w-6 bg-white/10" />
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
								Recensioni recenti
							</span>
						</div>
						<Link href="/feed" className="text-xs uppercase tracking-wider text-white/30 hover:text-[#FFC24B] transition">
							Tutte →
						</Link>
					</div>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{feed.map((it) => (
							<Link
								key={it.id}
								href={"/concert/" + it.concert_id}
								className="group flex items-start gap-4 border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25 hover:bg-white/[0.04]"
							>
								<div className="h-16 w-12 shrink-0 overflow-hidden">
									<ArtistImage
										name={it.concerts?.artists?.name ?? ""}
										mbid={it.concerts?.artists?.mbid ?? undefined}
										className="h-full w-full"
									/>
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										{it.profiles?.avatar_url && (
											<img src={it.profiles.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
										)}
										<span className="text-xs text-white/50">
											{it.profiles?.display_name || it.profiles?.username || "Anonimo"}
										</span>
										{it.rating != null && (
											<span className="ml-auto inline-flex items-center gap-0.5 text-xs text-[#FFC24B]">
												<Star className="h-3 w-3 fill-current" /> {it.rating}
											</span>
										)}
									</div>
									<p className="mt-1 text-sm font-semibold text-white/90 group-hover:text-white [font-family:var(--font-display)]">
										{it.concerts?.artists?.name ?? "Artista"}
									</p>
									<p className="mt-0.5 text-xs text-white/35">
										{it.concerts?.venues?.name}{it.concerts?.venues?.city ? " · " + it.concerts.venues.city : ""}
									</p>
									<p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-white/60">
										"{it.review}"
									</p>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{lists.length > 0 && (
				<section className="mb-14">
					<div className="mb-5 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-px w-6 bg-white/10" />
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
								Liste pubbliche
							</span>
						</div>
						<Link href="/lists" className="text-xs uppercase tracking-wider text-white/30 hover:text-[#FFC24B] transition">
							Tutte →
						</Link>
					</div>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
						{lists.map((l) => (
							<Link
								key={l.id}
								href={"/list/" + l.id}
								className="group border border-white/10 bg-white/[0.02] p-5 transition hover:border-white/25 hover:bg-white/[0.04]"
							>
								<h3 className="font-semibold text-white group-hover:text-[#FF2D6B] transition-colors [font-family:var(--font-display)]">
									{l.title}
								</h3>
								{l.description && (
									<p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/45">{l.description}</p>
								)}
							</Link>
						))}
					</div>
				</section>
			)}

			<section className="border-t border-white/10 pt-10">
				<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
					<div>
						{(counts.logs > 0 || counts.users > 0) && (
							<p className="text-sm text-white/30">
								{counts.logs} live raccontati da {counts.users} appassionati
							</p>
						)}
					</div>
					<Link
						href="/me"
						className="inline-flex w-fit shrink-0 items-center gap-2 border border-white/15 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white/70 transition hover:border-white/40 hover:text-white"
					>
						Il tuo diario <ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</section>
		</main>
	)
}