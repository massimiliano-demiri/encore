"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArtistImage } from "@/components/artsit-image"
import { Skeleton } from "@/components/skeleton"
import { LogConcert } from "@/components/ui/log-concert"

type Concert = {
	id: string
	date: string | null
	artists: { name: string } | null
	venues: { name: string; city: string | null } | null
}

type Review = {
	id: string
	rating: number | null
	review: string | null
	logged_at: string
	profiles: { username: string | null; display_name: string | null } | null
}

export default function ConcertPage() {
	const { id } = useParams<{ id: string }>()
	const supabase = createClient()
	const [concert, setConcert] = useState<Concert | null>(null)
	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			const { data: c } = await supabase
				.from("concerts")
				.select("id, date, artists(name), venues(name, city)")
				.eq("id", id)
				.maybeSingle()
			setConcert((c as unknown as Concert) ?? null)
			const { data: r } = await supabase
				.from("logs")
				.select("id, rating, review, logged_at, profiles(username, display_name)")
				.eq("concert_id", id)
				.order("logged_at", { ascending: false })
			setReviews((r as unknown as Review[]) ?? [])
			setLoading(false)
		}
		load()
	}, [id])

	if (loading)
	return (
		<main className="pb-10">
			<Skeleton className="h-72 w-full" />
			<div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-20 w-full rounded-lg" />
				<Skeleton className="h-20 w-full rounded-lg" />
			</div>
		</main>
	)
	if (!concert) return <main className="p-6">Concerto non trovato.</main>

	const rated = reviews.filter((x) => x.rating != null)
	const avg =
		rated.length > 0
			? (rated.reduce((s, x) => s + (x.rating ?? 0), 0) / rated.length).toFixed(1)
			: null
	const artist = concert.artists?.name ?? "Artista"

	return (
		<main className="pb-10">
			<div className="relative h-72 w-full overflow-hidden">
				<ArtistImage name={artist} className="absolute inset-0 h-full w-full" />
				<div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/60 to-transparent" />
				<div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl p-6">
					<h1 className="text-3xl font-bold text-white">{artist}</h1>
					<p className="mt-1 text-white/70">
						{concert.venues?.name}
						{concert.venues?.city ? ", " + concert.venues.city : ""}
						{concert.date ? " · " + concert.date : ""}
					</p>
				</div>
			</div>

			<div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
				<div className="flex items-center gap-3">
					{avg ? (
						<>
							<span className="text-4xl font-bold text-[#FF2D6B]">{avg}</span>
							<span className="text-sm text-muted-foreground">
								media su {rated.length} {rated.length === 1 ? "voto" : "voti"}
							</span>
						</>
					) : (
						<span className="text-sm text-muted-foreground">Ancora nessun voto</span>
					)}
				</div>
<LogConcert concertId={concert.id} />
				<h2 className="font-semibold">Recensioni</h2>
				{reviews.length === 0 ? (
					<p className="text-muted-foreground">Nessuna recensione ancora. Sii il primo!</p>
				) : (
					<ul className="flex flex-col gap-3">
						{reviews.map((x) => (
							<li key={x.id} className="rounded-lg border p-4">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">
										{x.profiles?.username ? (
											<Link href={"/u/" + x.profiles.username} className="hover:underline">
												{x.profiles.display_name || x.profiles.username}
											</Link>
										) : (
											"Qualcuno"
										)}
									</span>
									{x.rating != null && <span className="text-sm">{x.rating}★</span>}
								</div>
								{x.review && <p className="mt-1 text-sm">{x.review}</p>}
							</li>
						))}
					</ul>
				)}
			</div>
		</main>
	)
}