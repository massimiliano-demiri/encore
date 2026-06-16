"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ArtistImage } from "@/components/artsit-image"
import { Star, Newspaper } from "lucide-react"
import { SectionHeader } from "@/components/section-header"

type FeedItem = {
	id: string
	rating: number | null
	review: string | null
	concert_id: string
	profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null
	concerts: {
		date: string | null
		artists: { name: string; mbid: string | null } | null
		venues: { name: string; city: string | null } | null
	} | null
}

const PAGE_SIZE = 10

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""

export default function FeedPage() {
	const supabase = createClient()
	const { user } = useUser()
	const [tab, setTab] = useState<"all" | "following">("all")
	const [items, setItems] = useState<FeedItem[]>([])
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(false)

	const fetchPage = useCallback(async (offset: number): Promise<FeedItem[] | null> => {
		if (!supabase) return null
		let query = supabase
			.from("logs")
			.select("id, rating, review, concert_id, profiles(username, display_name, avatar_url), concerts(date, artists(name, mbid), venues(name, city))")
			.not("review", "is", null)
			.order("logged_at", { ascending: false })
			.range(offset, offset + PAGE_SIZE - 1)

		if (tab === "following") {
			if (!user) return []
			const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)
			const ids = (f ?? []).map((x: { following_id: string }) => x.following_id)
			if (ids.length === 0) return []
			query = query.in("user_id", ids)
		}

		const { data } = await query
		return (data as unknown as FeedItem[]) ?? []
	}, [supabase, tab, user])

	// Caricamento iniziale + reset al cambio tab
	useEffect(() => {
		let cancelled = false
		const load = async () => {
			setLoading(true)
			const first = await fetchPage(0)
			if (cancelled) return
			setItems(first ?? [])
			setHasMore((first?.length ?? 0) === PAGE_SIZE)
			setLoading(false)
		}
		load()
		return () => { cancelled = true }
	}, [fetchPage])

	const loadMore = async () => {
		setLoadingMore(true)
		const next = await fetchPage(items.length)
		if (next) {
			setItems((prev) => [...prev, ...next])
			setHasMore(next.length === PAGE_SIZE)
		}
		setLoadingMore(false)
	}

	return (
		<main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
			<SectionHeader label="Feed" />
			<div className="flex gap-2">
				<button onClick={() => setTab("all")}
					className={tab === "all" ? "border border-white/15 bg-white/10 px-4 py-1.5 text-sm" : "border border-transparent px-4 py-1.5 text-sm text-white/50 hover:text-white"}>
					Tutti
				</button>
				{user && (
					<button onClick={() => setTab("following")}
						className={tab === "following" ? "border border-white/15 bg-white/10 px-4 py-1.5 text-sm" : "border border-transparent px-4 py-1.5 text-sm text-white/50 hover:text-white"}>
						Seguiti
					</button>
				)}
			</div>

			{loading ? (
				<div className="flex flex-col gap-3">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="h-24 animate-pulse border-l-2 border-white/5 bg-white/[0.02]" />
					))}
				</div>
			) : items.length === 0 ? (
				<div className="border-l-2 border-white/5 py-6 pl-5 text-center text-white/40">
					<Newspaper className="mx-auto mb-2 h-6 w-6 text-white/15" />
					<p>{tab === "following" ? "Segui qualcuno per vedere i suoi concerti qui." : "Ancora nessuna recensione."}</p>
					<Link href="/search" className="mt-2 inline-block text-sm text-[#FF2D6B] hover:underline">
						Scopri i concerti →
					</Link>
				</div>
			) : (
				<>
					<div className="flex flex-col gap-3">
						{items.map((it) => (
							<Link key={it.id} href={"/concert/" + it.concert_id}
								className="group flex items-start gap-4 border-l-2 border-white/10 bg-white/[0.02] py-4 pl-5 transition hover:border-[#FF2D6B]/30 hover:bg-white/[0.04]">
								<div className="h-14 w-11 shrink-0 overflow-hidden">
									<ArtistImage name={it.concerts?.artists?.name ?? ""} mbid={it.concerts?.artists?.mbid ?? undefined} className="h-full w-full" />
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										{it.profiles?.avatar_url && <img src={it.profiles.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />}
										<span className="text-xs text-white/50">{it.profiles?.display_name || it.profiles?.username || "Anonimo"}</span>
										{it.rating != null && <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-bold text-[#FFC24B]"><Star className="h-3.5 w-3.5 fill-current" /> {it.rating}</span>}
									</div>
									<p className="mt-1 text-sm font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">{it.concerts?.artists?.name ?? "Artista"}</p>
									<p className="mt-0.5 text-xs text-white/35">{it.concerts?.venues?.name}{it.concerts?.venues?.city ? ", " + it.concerts.venues.city : ""} · {fmtDate(it.concerts?.date ?? null)}</p>
									<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/60">"{it.review}"</p>
								</div>
							</Link>
						))}
					</div>

					{loadingMore && (
	<div className="flex flex-col gap-3" aria-hidden="true">
		{[...Array(3)].map((_, i) => (
			<div key={i} className="h-24 animate-pulse border-l-2 border-white/5 bg-white/[0.02]" />
		))}
	</div>
)}
{hasMore && !loadingMore && (
	<button
		onClick={loadMore}
		className="inline-flex w-full items-center justify-center gap-2 border border-white/10 py-3 text-sm text-white/50 transition hover:text-white hover:border-white/25"
	>
		Mostra altri
	</button>
)}
				</>
			)}
		</main>
	)
}