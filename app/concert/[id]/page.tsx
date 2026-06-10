"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArtistImage } from "@/components/artsit-image"
import { Skeleton } from "@/components/skeleton"
import { LogConcert } from "@/components/ui/log-concert"
import { Setlist } from "@/components/setlist"
import { ConcertPhotos } from "@/components/concert-photos"
import { Star, ListMusic, MessageSquare } from "lucide-react"
import { AddToList } from "@/components/add-to-list"
import { ReviewLikes } from "@/components/review-likes"
import { ReviewComments } from "@/components/review-comments"
import { ShareCardButton } from "@/components/share-card-button"

type Concert = {
	id: string
	date: string | null
	artists: { name: string; mbid: string | null } | null
	venues: { name: string; city: string | null } | null
}

type Review = {
	id: string
	rating: number | null
	review: string | null
	logged_at: string
	profiles: { username: string | null; display_name: string | null } | null
}

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""

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
				.select("id, date, artists(name, mbid), venues(name, city)")
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
					<Skeleton className="h-24 w-full rounded-2xl" />
					<Skeleton className="h-24 w-full rounded-2xl" />
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
				<ArtistImage name={artist} mbid={concert.artists?.mbid ?? undefined} className="absolute inset-0 h-full w-full" />
				<div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/60 to-transparent" />
				<div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl p-6">
					<p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#FF2D6B]">Concerto</p>
					<h1 className="text-3xl font-bold text-white [font-family:var(--font-display)]">{artist}</h1>
					<p className="mt-1 text-white/70">
						{concert.venues?.name}
						{concert.venues?.city ? ", " + concert.venues.city : ""}
						{concert.date ? " · " + fmtDate(concert.date) : ""}
					</p>
				</div>
			</div>

			<div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
				<div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
					{avg ? (
						<>
							<div className="flex items-baseline gap-1">
								<span className="text-4xl font-bold text-[#FF2D6B] [font-family:var(--font-display)]">{avg}</span>
								<span className="text-white/40">/5</span>
							</div>
							<span className="text-sm text-white/50">
								media su {rated.length} {rated.length === 1 ? "voto" : "voti"}
							</span>
						</>
					) : (
						<span className="text-sm text-white/50">Ancora nessun voto</span>
					)}
				</div>

				<LogConcert concertId={concert.id} />
				<AddToList concertId={concert.id} />

				<div>
					<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
						<ListMusic className="h-4 w-4" /> Scaletta
					</h2>
					<Setlist mbid={concert.artists?.mbid ?? null} date={concert.date} />
				</div>

				<ConcertPhotos concertId={concert.id} />

				<div>
					<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
						<MessageSquare className="h-4 w-4" /> Recensioni
					</h2>
					{reviews.length === 0 ? (
						<p className="text-white/50">Nessuna recensione ancora. Sii il primo!</p>
					) : (
						<ul className="flex flex-col gap-3">
							{reviews.map((x) => (
								<li key={x.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
									<div className="flex items-center justify-between">
										<div className="flex flex-col">
											<span className="text-sm font-medium">
												{x.profiles?.username ? (
													<Link href={"/u/" + x.profiles.username} className="hover:underline">
														{x.profiles.display_name || x.profiles.username}
													</Link>
												) : (
													"Qualcuno"
												)}
											</span>
											<span className="text-xs text-white/40">{fmtDate(x.logged_at)}</span>
										</div>
										{x.rating != null && (
											<span className="inline-flex items-center gap-1 text-sm font-medium text-[#FFC24B]">
												<Star className="h-3.5 w-3.5 fill-current" /> {x.rating}
											</span>
										)}
									</div>
									{x.review && <p className="mt-2 text-sm text-white/70">{x.review}</p>}
									<div className="mt-3 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3">
										<ReviewLikes logId={x.id} />
										<ReviewComments logId={x.id} />
										<ShareCardButton logId={x.id} />
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</main>
	)
}