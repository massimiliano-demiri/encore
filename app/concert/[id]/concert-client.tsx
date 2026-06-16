"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArtistImage } from "@/components/artsit-image"
import { Skeleton } from "@/components/skeleton"
import { LogConcert } from "@/components/ui/log-concert"
import { Setlist } from "@/components/setlist"
import { ConcertPhotos } from "@/components/concert-photos"
import { RsvpButton } from "@/components/rsvp-button"
import { Star, ListMusic, MessageSquare, Users, CalendarCheck } from "lucide-react"
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

type Attendee = {
	profiles: {
		username: string | null
		display_name: string | null
		avatar_url: string | null
	} | null
}

type RsvpUser = {
	profiles: {
		username: string | null
		display_name: string | null
		avatar_url: string | null
	} | null
}

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""

export function ConcertClient({ id }: { id: string }) {
	const supabase = createClient()
	const [concert, setConcert] = useState<Concert | null>(null)
	const [reviews, setReviews] = useState<Review[]>([])
	const [attendees, setAttendees] = useState<Attendee[]>([])
	const [rsvps, setRsvps] = useState<RsvpUser[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			if (!supabase) { setLoading(false); return }

			try {
				// 1) Cerca il concerto: prova UUID, poi setlistfm_id
				let { data: c } = await supabase
					.from("concerts")
					.select("id, date, artists(name, mbid), venues(name, city)")
					.eq("id", id)
					.maybeSingle()

				if (!c) {
    const fallback = await supabase
        .from("concerts")
        .select("id, date, artists(name, mbid), venues(name, city)")
        .eq("setlistfm_id", id)
        .maybeSingle()
    c = fallback.data
}

// 3° fallback: Ticketmaster event ID → fetch + save al volo
if (!c) {
    try {
        const resolveRes = await fetch("/api/resolve-concert?id=" + encodeURIComponent(id))
        if (resolveRes.ok) {
            const resolved = await resolveRes.json()
            if (resolved?.concertId) {
                const refetch = await supabase
                    .from("concerts")
                    .select("id, date, artists(name, mbid), venues(name, city)")
                    .eq("id", resolved.concertId)
                    .maybeSingle()
                c = refetch.data
            }
        }
    } catch { /* ignore */ }
}

				const concertData = (c as unknown as Concert) ?? null
				setConcert(concertData)

				if (!concertData) { setLoading(false); return }

				// 2) Logs e partecipanti (in parallelo, senza RSVP)
				const [{ data: r }, { data: a }] = await Promise.all([
					supabase
						.from("logs")
						.select("id, rating, review, logged_at, profiles(username, display_name)")
						.eq("concert_id", concertData.id)
						.order("logged_at", { ascending: false }),
					supabase
						.from("logs")
						.select("profiles(username, display_name, avatar_url)")
						.eq("concert_id", concertData.id),
				])
				setReviews((r as unknown as Review[]) ?? [])
				setAttendees((a as unknown as Attendee[]) ?? [])

				// 3) RSVP — query separata, non deve bloccare il resto se fallisce
				try {
					const { data: rsvpData } = await supabase
						.from("rsvps")
						.select("profiles(username, display_name, avatar_url)")
						.eq("concert_id", concertData.id)

					if (rsvpData && (rsvpData as any[]).length > 0) {
						setRsvps((rsvpData as unknown as RsvpUser[]) ?? [])
					}
				} catch {
					// RSVP non essenziale — se fallisce, ignora
				}
			} catch {
				// Error generico — almeno mostra il messaggio
			}

			setLoading(false)
		}
		load()
	}, [id, supabase])

	const uniqueAttendees = useMemo(() => {
		const seen = new Set<string>()
		return attendees.filter((a) => {
			const key = a.profiles?.username ?? a.profiles?.display_name ?? ""
			if (!key || seen.has(key)) return false
			seen.add(key)
			return true
		})
	}, [attendees])

	if (loading)
		return (
			<main className="pb-10">
				<Skeleton className="h-72 w-full" />
				<div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
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
	const isFuture = concert.date ? new Date(concert.date) > new Date() : false

	return (
		<main className="pb-10">
			<div className="relative h-72 w-full overflow-hidden">
				<ArtistImage name={artist} mbid={concert.artists?.mbid ?? undefined} className="absolute inset-0 h-full w-full" />
				<div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/60 to-transparent" />
				<div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl p-6">
					<p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#FF2D6B]">Concerto</p>
					<h1 className="text-3xl font-bold text-white [font-family:var(--font-display)]">{artist}</h1>
					<p className="mt-1 text-white/70">
						{concert.venues?.name}
						{concert.venues?.city ? ", " + concert.venues.city : ""}
						{concert.date ? " · " + fmtDate(concert.date) : ""}
					</p>
				</div>
			</div>

			<div className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
				<div className="flex flex-wrap items-center gap-4 border-l-2 border-[#FF2D6B]/40 bg-white/[0.02] py-4 pl-5">
					{avg ? (
						<>
							<div className="flex items-baseline gap-1">
								<span className="text-5xl font-bold text-[#FF2D6B] [font-family:var(--font-display)]">{avg}</span>
								<span className="text-white/40">/5</span>
							</div>
							<span className="text-sm text-white/50">
								media su {rated.length} {rated.length === 1 ? "voto" : "voti"}
							</span>
						</>
					) : (
						<span className="text-sm text-white/50">Ancora nessun voto</span>
					)}
					{isFuture && <RsvpButton concertId={concert.id} concertDate={concert.date} />}
				</div>

				{uniqueAttendees.length > 0 && (
					<div>
						<div className="mb-4 flex items-center gap-3">
							<div className="h-px w-6 bg-white/10" />
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
								Chi c&apos;era ({uniqueAttendees.length})
							</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{uniqueAttendees.map((a, i) => {
								const name = a.profiles?.display_name || a.profiles?.username || "Anonimo"
								const initials = name.trim().slice(0, 2).toUpperCase()
								const href = a.profiles?.username ? "/u/" + a.profiles.username : "#"
								return (
									<Link
										key={i}
										href={href}
										className="flex items-center gap-2 border border-white/10 bg-white/[0.02] py-1.5 pl-1.5 pr-4 transition hover:border-[#FF2D6B]/40 hover:bg-white/[0.05]"
									>
										{a.profiles?.avatar_url ? (
											<img src={a.profiles.avatar_url} alt={name} className="h-7 w-7 rounded-full object-cover" />
										) : (
											<div className="flex h-7 w-7 items-center justify-center bg-gradient-to-br from-[#FF2D6B]/60 to-[#7A5CFF]/60 text-xs font-bold text-white">
												{initials}
											</div>
										)}
										<span className="text-sm text-white/80">{name}</span>
									</Link>
								)
							})}
						</div>
					</div>
				)}

				{isFuture && rsvps.length > 0 && (
					<div>
						<div className="mb-4 flex items-center gap-3">
							<div className="h-px w-6 bg-[#FFC24B]/40" />
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC24B]">
								<CalendarCheck className="inline h-3.5 w-3.5 mr-1.5" />
								Parteciperanno ({rsvps.length})
							</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{rsvps.map((r, i) => {
								const name = r.profiles?.display_name || r.profiles?.username || "Anonimo"
								const initials = name.trim().slice(0, 2).toUpperCase()
								const href = r.profiles?.username ? "/u/" + r.profiles.username : "#"
								return (
									<Link
										key={i}
										href={href}
										className="flex items-center gap-2 border border-[#FFC24B]/20 bg-[#FFC24B]/[0.03] py-1.5 pl-1.5 pr-4 transition hover:border-[#FFC24B]/50 hover:bg-[#FFC24B]/[0.06]"
									>
										{r.profiles?.avatar_url ? (
											<img src={r.profiles.avatar_url} alt={name} className="h-7 w-7 rounded-full object-cover" />
										) : (
											<div className="flex h-7 w-7 items-center justify-center bg-gradient-to-br from-[#FFC24B]/60 to-[#FF2D6B]/60 text-xs font-bold text-white">
												{initials}
											</div>
										)}
										<span className="text-sm text-white/80">{name}</span>
									</Link>
								)
							})}
						</div>
					</div>
				)}

				<LogConcert concertId={concert.id} concertDate={concert.date} />
				<AddToList concertId={concert.id} />

				<div>
					<div className="mb-4 flex items-center gap-3">
						<div className="h-px w-6 bg-white/10" />
						<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Scaletta</span>
					</div>
					<Setlist mbid={concert.artists?.mbid ?? null} date={concert.date} />
				</div>

				<ConcertPhotos concertId={concert.id} />

				<div>
					<div className="mb-4 flex items-center gap-3">
						<div className="h-px w-6 bg-white/10" />
						<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
							Recensioni ({reviews.length})
						</span>
					</div>
					{reviews.length === 0 ? (
						<p className="border-l-2 border-white/5 py-3 pl-4 text-sm text-white/40">
							Nessuna recensione ancora. Sii il primo!
						</p>
					) : (
						<div className="flex flex-col gap-3">
							{reviews.map((x) => (
								<div
									key={x.id}
									className="group border-l-2 border-white/10 bg-white/[0.02] py-4 pl-5 transition hover:border-[#FF2D6B]/30"
								>
									<div className="flex items-center justify-between">
										<div className="flex flex-col">
											<span className="text-sm font-semibold text-white">
												{x.profiles?.username ? (
													<Link href={"/u/" + x.profiles.username} className="hover:text-[#FFC24B] transition-colors">
														{x.profiles.display_name || x.profiles.username}
													</Link>
												) : (
													"Qualcuno"
												)}
											</span>
											<span className="text-xs text-white/40">{fmtDate(x.logged_at)}</span>
										</div>
										{x.rating != null && (
											<span className="inline-flex items-center gap-1 text-sm font-bold text-[#FFC24B]">
												<Star className="h-4 w-4 fill-current" /> {x.rating}
											</span>
										)}
									</div>
									{x.review && <p className="mt-2 text-sm leading-relaxed text-white/70">{x.review}</p>}
									<div className="mt-3 flex flex-wrap items-center gap-4 border-t border-white/5 pt-3">
										<ReviewLikes logId={x.id} />
										<ReviewComments logId={x.id} />
										<ShareCardButton logId={x.id} />
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</main>
	)
}