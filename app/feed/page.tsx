"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type FeedItem = {
	id: string
	rating: number | null
	review: string | null
	logged_at: string
	concert_id: string
	concerts: {
		date: string
		artists: { name: string } | null
		venues: { name: string; city: string } | null
	} | null
}

export default function FeedPage() {
	const supabase = createClient()
	const [items, setItems] = useState<FeedItem[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			const { data } = await supabase
				.from("logs")
				.select(
					"id, rating, review, logged_at, concert_id, concerts(date, artists(name), venues(name, city))"
				)
				.not("review", "is", null)
				.order("logged_at", { ascending: false })
				.limit(30)
			setItems((data as unknown as FeedItem[]) ?? [])
			setLoading(false)
		}
		load()
	}, [supabase])

	if (loading) return <main className="p-6">Carico…</main>

	return (
		<main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
			<h1 className="text-2xl font-bold">Ultimi live raccontati</h1>
			{items.length === 0 && (
				<p className="text-muted-foreground">
					Ancora nessuna recensione. Sii il primo a raccontare un concerto!
				</p>
			)}
			{items.map((it) => (
				<Link
					key={it.id}
					href={"/concert/" + it.concert_id}
					className="rounded-lg border p-4 hover:bg-white/5"
				>
					<div className="flex items-center justify-between">
						<span className="font-semibold">
							{it.concerts?.artists?.name ?? "Artista"}
						</span>
						{it.rating != null && <span className="text-sm">{it.rating}★</span>}
					</div>
					<div className="text-sm text-muted-foreground">
						{it.concerts?.venues?.name}
						{it.concerts?.venues?.city ? ", " + it.concerts.venues.city : ""} ·{" "}
						{it.concerts?.date}
					</div>
					{it.review && <p className="mt-2 text-sm">{it.review}</p>}
				</Link>
			))}
		</main>
	)
}