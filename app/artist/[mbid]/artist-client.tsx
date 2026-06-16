"use client"

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useUser } from "@/lib/use-user"
import { LogConcert } from "@/components/ui/log-concert"
import { RsvpButton } from "@/components/rsvp-button"
import { ArtistImage } from "@/components/artsit-image"
import { Skeleton } from "@/components/skeleton"
import { ArrowLeft, MapPin, Calendar, Ticket, Music, ChevronRight } from "lucide-react"

/* ─── tipi ─── */
type Concert = {
	id: string
	date: string | null
	venue: string
	city: string
	country: string
	source?: string
	setlist?: string[]
	setlistLoading?: boolean
}

/* ─── helper ─── */
const fmtDate = (d: string | null): string => {
	if (!d) return "data sconosciuta"
	const t = new Date(d)
	return isNaN(t.getTime()) ? d : t.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
}

const getYear = (d: string | null): string => {
	if (!d) return "Sconosciuto"
	return d.slice(0, 4)
}

async function fetchSetlist(mbid: string, date: string): Promise<string[]> {
	try {
		const res = await fetch("/api/setlist?mbid=" + encodeURIComponent(mbid) + "&date=" + encodeURIComponent(date))
		if (!res.ok) return []
		const data = await res.json()
		if (data.sets?.sets?.set) {
			const songs: string[] = []
			for (const set of data.sets.sets.set) {
				for (const song of (set.song ?? [])) {
					songs.push(song.name)
				}
			}
			return songs.slice(0, 5)
		}
		return []
	} catch {
		return []
	}
}

/* ─── componente ─── */
export function ArtistClient({ mbid }: { mbid: string }) {
	const { user } = useUser()
	const [artist, setArtist] = useState("")
	const [concerts, setConcerts] = useState<Concert[]>([])
	const [upcoming, setUpcoming] = useState<Concert[]>([])
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [loadingMore, setLoadingMore] = useState(false)
	const yearBarRef = useRef<HTMLDivElement | null>(null)
	const today = new Date().toISOString().slice(0, 10)

	const { upcomingFromSetlist, past } = useMemo<{ upcomingFromSetlist: Concert[]; past: Concert[] }>(() => {
		const u: Concert[] = []
		const p: Concert[] = []
		for (const c of concerts) {
			if (c.date && c.date >= today) u.push(c)
			else p.push(c)
		}
		return { upcomingFromSetlist: u, past: p }
	}, [concerts, today])

	const allUpcoming = [...upcoming, ...upcomingFromSetlist]

	// Raggruppa passati per anno
	const pastByYear = useMemo(() => {
		const map = new Map<string, Concert[]>()
		for (const c of past) {
			const y = getYear(c.date)
			if (!map.has(y)) map.set(y, [])
			map.get(y)!.push(c)
		}
		return [...map.entries()].sort((a, b) => Number(b[0]) - Number(a[0]))
	}, [past])

	const years = useMemo(() => pastByYear.map(([y]) => y), [pastByYear])
	const hasMore = concerts.length < total

	useEffect(() => {
		setLoading(true)
		setConcerts([])
		setUpcoming([])
		setPage(1)
		fetch("/api/artists/" + mbid + "/concerts?p=1")
			.then((r) => r.json())
			.then((d: { artist: string; concerts: Concert[]; upcoming: Concert[]; total: number }) => {
				setArtist(d.artist)
				setConcerts(d.concerts ?? [])
				setUpcoming(d.upcoming ?? [])
				setTotal(d.total ?? 0)
				setLoading(false)
			})
	}, [mbid])

	const loadMore = async () => {
		const nextPage = page + 1
		setLoadingMore(true)
		try {
			const res = await fetch("/api/artists/" + mbid + "/concerts?p=" + nextPage)
			const d = await res.json()
			setConcerts((prev) => [...prev, ...(d.concerts ?? [])])
			setPage(nextPage)
			setTotal(d.total ?? 0)
		} catch { /* ignore */ }
		setLoadingMore(false)
	}

	// Fetch scalette per i passati visibili (prime 3 per anno, massimo 9 totali)
	useEffect(() => {
		if (past.length === 0 || loading) return
		const toFetch = pastByYear.flatMap(([, concerts]) => concerts.slice(0, 3)).slice(0, 9)
		const fetchAll = async () => {
			const results = await Promise.all(
				toFetch.map(async (c) => {
					if (!c.date || c.setlist !== undefined) return null
					const songs = await fetchSetlist(mbid, c.date)
					return { id: c.id, songs }
				}),
			)
			setConcerts((prev) =>
				prev.map((c) => {
					const hit = results.find((r) => r?.id === c.id)
					if (hit && hit.songs.length > 0) return { ...c, setlist: hit.songs, setlistLoading: false }
					if (hit) return { ...c, setlistLoading: false }
					return c
				}),
			)
		}
		fetchAll()
	}, [past.length > 0 && !loading])

	const scrollToYear = useCallback((year: string) => {
		const el = document.getElementById("year-" + year)
		if (el) {
			const top = el.getBoundingClientRect().top + window.scrollY - 100
			window.scrollTo({ top, behavior: "smooth" })
		}
	}, [])

	return (
		<main className="pb-10">
			{/* Hero */}
			<div className="relative h-64 w-full overflow-hidden">
				<ArtistImage name={artist} mbid={mbid} className="absolute inset-0 h-full w-full" />
				<div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/60 to-transparent" />
				<Link
					href="/search"
					className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-sm text-white/80 backdrop-blur transition hover:text-white"
				>
					<ArrowLeft className="h-4 w-4" /> Cerca
				</Link>
				<div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl p-6">
					<p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#FF2D6B]">Artista</p>
					<h1 className="text-3xl font-bold text-white [font-family:var(--font-display)]">{artist || "Artista"}</h1>
				</div>
			</div>

			<div className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
				{loading ? (
					<div className="flex flex-col gap-3">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="h-20 animate-pulse border-l-2 border-white/5 bg-white/[0.02]" />
						))}
					</div>
				) : concerts.length === 0 && upcoming.length === 0 ? (
					<div className="border-l-2 border-white/5 py-4 pl-5 text-white/40">Nessun concerto trovato.</div>
				) : (
					<>
						{/* ── PROSSIMI ── */}
						{allUpcoming.length > 0 && (
							<div>
								<div className="mb-4 flex items-center gap-3">
									<div className="h-px w-6 bg-[#FFC24B]/40" />
									<span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC24B]">
										Prossimi ({allUpcoming.length})
									</span>
								</div>
								<div className="flex flex-col gap-2">
									{allUpcoming.map((c) => (
										<div
											key={c.id}
											className="border-l-2 border-[#FFC24B]/20 bg-white/[0.02] py-3 pl-4 transition hover:border-[#FFC24B]/50"
										>
											<div className="flex items-center justify-between">
												<div>
													<Link href={"/concert/" + c.id} className="block">
														<div className="font-semibold text-white hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">
															{c.venue}
														</div>
													</Link>
													<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-white/45">
														<span className="inline-flex items-center gap-1.5">
															<MapPin className="h-3.5 w-3.5" /> {c.city}
															{c.country ? ", " + c.country : ""}
														</span>
														<span className="inline-flex items-center gap-1.5">
															<Calendar className="h-3.5 w-3.5" /> {fmtDate(c.date)}
														</span>
														{c.source === "ticketmaster" && (
															<span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#FFC24B] uppercase">
																<Ticket className="h-3 w-3" /> Ticketmaster
															</span>
														)}
													</div>
												</div>
												<div className="shrink-0">
													<RsvpButton concertId={c.id} concertDate={c.date} />
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* ── BARRA ANNI ── */}
						{years.length > 1 && (
							<div
								ref={yearBarRef}
								className="sticky top-[57px] z-20 -mx-6 flex gap-1 overflow-x-auto border-b border-white/10 bg-[#0E0E12]/90 px-6 py-2 backdrop-blur"
							>
								{years.map((y) => (
									<button
										key={y}
										onClick={() => scrollToYear(y)}
										className="shrink-0 rounded px-3 py-1 text-xs font-medium text-white/50 transition hover:bg-white/10 hover:text-white"
									>
										{y}
									</button>
								))}
							</div>
						)}

						{/* ── PASSATI (timeline per anno, collassabile) ── */}
						{pastByYear.map(([year, yearConcerts], yearIndex) => (
							<details
								key={year}
								id={"year-" + year}
								open={yearIndex === 0}
								className="group/year"
							>
								<summary className="mb-3 flex cursor-pointer list-none items-center gap-3 select-none">
									<ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25 transition-transform group-open/year:rotate-90" />
									<div className="h-px w-6 bg-white/10" />
									<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
										{year} ({yearConcerts.length})
									</span>
								</summary>
								<div className="flex flex-col gap-2 pl-1">
									{yearConcerts.slice(0, 3).map((c) => (
										<ConcertRow key={c.id} c={c} user={user} />
									))}
									{yearConcerts.length > 3 && (
										<details className="group mt-1">
											<summary className="cursor-pointer px-4 py-2 text-xs font-medium text-white/30 hover:text-white/60 transition">
												+ altri {yearConcerts.length - 3} concerti nel {year}
											</summary>
											<div className="mt-2 flex flex-col gap-2">
												{yearConcerts.slice(3).map((c) => (
													<ConcertRow key={c.id} c={c} user={user} minimal />
												))}
											</div>
										</details>
									)}
								</div>
							</details>
						))}
					</>
				)}

				{!loading && hasMore && (
					<button
						onClick={loadMore}
						disabled={loadingMore}
						className="inline-flex w-full items-center justify-center gap-2 border border-white/10 py-3 text-sm text-white/50 transition hover:text-white hover:border-white/25 disabled:opacity-40"
					>
						{loadingMore ? "Carico…" : "Carica altri concerti"}
					</button>
				)}
			</div>
		</main>
	)
}

/* ── Card concerto (con scaletta inline) ── */
function ConcertRow({ c, user, minimal }: { c: Concert; user: any; minimal?: boolean }) {
	const [showForm, setShowForm] = useState(false)
	const isFuture = c.date ? new Date(c.date) > new Date() : false

	return (
		<div className="border-l-2 border-white/10 bg-white/[0.02] py-3 pl-4 transition hover:border-[#FF2D6B]/30">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					{!minimal && (
						<div className="mb-1 flex items-center gap-2 text-xs text-white/35">
							<Calendar className="h-3 w-3" />
							{fmtDate(c.date)}
						</div>
					)}
					<Link href={"/concert/" + c.id} className="block">
						<div className="font-semibold text-white hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">
							{c.venue}
						</div>
					</Link>
					<div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-white/45">
						<span className="inline-flex items-center gap-1">
							<MapPin className="h-3 w-3" /> {c.city}
							{c.country ? ", " + c.country : ""}
						</span>
						{minimal && (
							<span className="inline-flex items-center gap-1">
								<Calendar className="h-3 w-3" /> {fmtDate(c.date)}
							</span>
						)}
					</div>

					{/* Scaletta inline */}
					{!minimal && c.setlist && c.setlist.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5">
							<Music className="mt-0.5 h-3 w-3 shrink-0 text-white/20" />
							{c.setlist.map((song, i) => (
								<span key={i} className="text-xs text-white/35">
									{song}{i < c.setlist!.length - 1 ? " · " : ""}
								</span>
							))}
						</div>
					)}

					{/* Link "C'eri?" — espande il form solo al click */}
					{!isFuture && user && !minimal && !showForm && (
						<button
							onClick={() => setShowForm(true)}
							className="mt-2 text-xs text-white/30 hover:text-[#FF2D6B] transition"
						>
							C&apos;eri? Vota e racconta
						</button>
					)}
					{showForm && (
						<div className="mt-2">
							<LogConcert concertId={c.id} concertDate={c.date} />
						</div>
					)}
				</div>
			</div>
		</div>
	)
}