"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"

type FeedItem = {
	id: string
	rating: number | null
	review: string | null
	concert_id: string
	profiles: { username: string | null; display_name: string | null } | null
	concerts: {
		date: string | null
		artists: { name: string } | null
		venues: { name: string; city: string | null } | null
	} | null
}

export default function FeedPage() {
	const supabase = createClient()
	const { user } = useUser()
	const [tab, setTab] = useState<"all" | "following">("all")
	const [items, setItems] = useState<FeedItem[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			if (!supabase) return
			setLoading(true)
			let query = supabase
				.from("logs")
				.select(
					"id, rating, review, concert_id, profiles(username, display_name), concerts(date, artists(name), venues(name, city))",
				)
				.not("review", "is", null)
				.order("logged_at", { ascending: false })
				.limit(30)

			if (tab === "following" && user) {
				const { data: f } = await supabase
					.from("follows")
					.select("following_id")
					.eq("follower_id", user.id)
				const ids = (f ?? []).map((x: { following_id: string }) => x.following_id)
				if (ids.length === 0) {
					setItems([])
					setLoading(false)
					return
				}
				query = query.in("user_id", ids)
			}

			const { data } = await query
			setItems((data as unknown as FeedItem[]) ?? [])
			setLoading(false)
		}
		load()
	}, [tab, user, supabase])

	return (
		<main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
			<h1 className="text-2xl font-bold">Feed</h1>
			<div className="flex gap-2">
				<button
					onClick={() => setTab("all")}
					className={
						tab === "all"
							? "rounded-full bg-white/10 px-3 py-1 text-sm"
							: "px-3 py-1 text-sm text-white/60"
					}
				>
					Tutti
				</button>
				{user && (
					<button
						onClick={() => setTab("following")}
						className={
							tab === "following"
								? "rounded-full bg-white/10 px-3 py-1 text-sm"
								: "px-3 py-1 text-sm text-white/60"
						}
					>
						Seguiti
					</button>
				)}
			</div>
			{loading ? (
				<p>Carico…</p>
			) : items.length === 0 ? (
				<p className="text-muted-foreground">
					{tab === "following"
						? "Segui qualcuno per vedere i suoi concerti qui."
						: "Ancora nessuna recensione."}
				</p>
			) : (
				items.map((it) => (
					<div key={it.id} className="rounded-lg border p-4">
						<div className="text-xs text-muted-foreground">
							{it.profiles?.username ? (
								<Link href={"/u/" + it.profiles.username} className="hover:underline">
									{it.profiles.display_name || it.profiles.username}
								</Link>
							) : (
								"Qualcuno"
							)}
						</div>
						<Link href={"/concert/" + it.concert_id} className="mt-1 block">
							<div className="flex items-center justify-between">
								<span className="font-semibold">
									{it.concerts?.artists?.name ?? "Artista"}
								</span>
								{it.rating != null && (
									<span className="text-sm">{it.rating}★</span>
								)}
							</div>
							<div className="text-sm text-muted-foreground">
								{it.concerts?.venues?.name}
								{it.concerts?.venues?.city
									? ", " + it.concerts.venues.city
									: ""}{" "}
								· {it.concerts?.date ?? ""}
							</div>
						</Link>
						{it.review && <p className="mt-2 text-sm">{it.review}</p>}
					</div>
				))
			)}
		</main>
	)
}