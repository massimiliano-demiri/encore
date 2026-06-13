"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star, ArrowRight, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ConcertPoster } from "@/components/concert-poster"
import { ArtistImage } from "@/components/artsit-image"

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

type SeedProfile = {
	username: string | null
	display_name: string | null
	avatar_url: string | null
}

export default function Home() {
	const { user } = useUser()
	const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
	const [feed, setFeed] = useState<FeedItem[]>([])
	const [popular, setPopular] = useState<FeedItem[]>([])
	const [lists, setLists] = useState<ListRow[]>([])
	const [counts, setCounts] = useState({ logs: 0, users: 0 })
	const [seedAvatars, setSeedAvatars] = useState<SeedProfile[]>([])
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
				{ data: seeds },
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
				supabase
					.from("profiles")
					.select("username, display_name, avatar_url")
					.not("username", "is", null)
					.limit(12),
			])
			setFeed((recent as unknown as FeedItem[]) ?? [])
			setPopular((top as unknown as FeedItem[]) ?? [])
			setLists((ls as unknown as ListRow[]) ?? [])
			setCounts({ logs: logsRes.count ?? 0, users: usersRes.count ?? 0 })
			setSeedAvatars((seeds as unknown as SeedProfile[]) ?? [])
			setLoading(false)
		}
		load()
	}, [supabase])

	if (loading) return null

	return (
		<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
			{/* Pitch per nuovi visitatori — solo se non loggato */}
			{!user && (
				<div className="mb-10">
					<p className="text-2xl font-bold leading-snug sm:text-3xl [font-family:var(--font-display)]">
						Il diario dei tuoi concerti.
					</p>
					<p className="mt-1.5 max-w-lg text-base text-white/45 sm:text-lg">
						Vota, recensisci e scopri chi c&apos;era con te. Ogni live, per sempre.
					</p>
				</div>
			)}

			{/* ───── CONCERTI POPOLARI (griglia poster) ───── */}
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

			{/* ───── UNISCITI ALLA COMMUNITY (solo non loggati) ───── */}
			{!user && (
				<section className="mb-14">
					<div className="flex flex-col gap-6 rounded-none border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
						<div className="flex-1">
							<div className="mb-2 flex items-center gap-2">
								<Users className="h-4 w-4 text-[#FF2D6B]" />
								<span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF2D6B]">
									{counts.users} appassionati
								</span>
							</div>
							<h2 className="text-2xl font-bold leading-tight sm:text-3xl [font-family:var(--font-display)]">
								Unisciti alla community
							</h2>
							<p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
								Tieni il diario dei tuoi concerti, leggi le recensioni di chi c&apos;era con te e scopri nuovi live.
							</p>

							{seedAvatars.length > 0 && (
								<div className="mt-4 flex items-center gap-1">
									{seedAvatars.slice(0, 8).map((s, i) => {
										const initials = (s.display_name || s.username || "?").trim().slice(0, 2).toUpperCase()
										return s.avatar_url ? (
											<img
												key={i}
												src={s.avatar_url}
												alt=""
												className="h-8 w-8 rounded-full object-cover ring-2 ring-[#0E0E12] -ml-1 first:ml-0"
											/>
										) : (
											<div
												key={i}
												className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D6B]/60 to-[#7A5CFF]/60 text-xs font-bold text-white ring-2 ring-[#0E0E12] -ml-1 first:ml-0"
											>
												{initials}
											</div>
										)
									})}
									{seedAvatars.length > 8 && (
										<span className="ml-1 text-xs text-white/30">+{seedAvatars.length - 8}</span>
									)}
								</div>
							)}
						</div>
						<div className="shrink-0 flex flex-col gap-2">
							<Link
								href="/signup"
								className="inline-flex w-fit items-center gap-2 bg-[#FF2D6B] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110"
							>
								Crea il tuo diario <ArrowRight className="h-4 w-4" />
							</Link>
							<p className="text-xs text-white/25">Ci vogliono trenta secondi.</p>
						</div>
					</div>
				</section>
			)}

			{/* ───── RECENSIONI RECENTI ───── */}
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

			{/* ───── LISTE PUBBLICHE ───── */}
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

			{/* ───── STATS + CTA (solo per loggati) ───── */}
			{user && (
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
			)}
		</main>
	)
}