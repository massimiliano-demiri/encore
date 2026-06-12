"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useUser } from "@/lib/use-user"
import { LogConcert } from "@/components/ui/log-concert"
import { ArtistImage } from "@/components/artsit-image"
import { Skeleton } from "@/components/skeleton"
import { ArrowLeft, MapPin, Calendar, ChevronDown } from "lucide-react"

type Concert = {
	id: string
	date: string | null
	venue: string
	city: string
	country: string
}

const fmtDate = (d: string | null) => {
	if (!d) return "data sconosciuta"
	const t = new Date(d)
	return isNaN(t.getTime()) ? d : t.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
}

export function ArtistClient({ mbid }: { mbid: string }) {
	const { user } = useUser()
	const [artist, setArtist] = useState("")
	const [concerts, setConcerts] = useState<Concert[]>([])
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [loadingMore, setLoadingMore] = useState(false)
	const [showAllPast, setShowAllPast] = useState(false)

	const today = new Date().toISOString().slice(0, 10)

	const { upcoming, past } = useMemo(() => {
		const u: Concert[] = []
		const p: Concert[] = []
		for (const c of concerts) {
			if (c.date && c.date >= today) u.push(c)
			else p.push(c)
		}
		return { upcoming: u, past: p }
	}, [concerts, today])

	const hasMore = concerts.length < total

	useEffect(() => {
		setLoading(true)
		setConcerts([])
		setPage(1)
		fetch("/api/artists/" + mbid + "/concerts?p=1")
			.then((r) => r.json())
			.then((d) => {
				setArtist(d.artist)
				setConcerts(d.concerts)
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

	const displayedPast = showAllPast ? past : past.slice(0, 5)

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
				{/* Loading */}
				{loading ? (
					<div className="flex flex-col gap-3">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="h-20 animate-pulse border-l-2 border-white/5 bg-white/[0.02]" />
						))}
					</div>
				) : concerts.length === 0 ? (
					<div className="border-l-2 border-white/5 py-4 pl-5 text-white/40">
						Nessun concerto trovato.
					</div>
				) : (
					<>
						{/* Prossimi concerti */}
						{upcoming.length > 0 && (
							<div>
								<div className="mb-4 flex items-center gap-3">
									<div className="h-px w-6 bg-white/10" />
									<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
										Prossimi ({upcoming.length})
									</span>
								</div>
								<div className="flex flex-col gap-3">
									{upcoming.map((c) => (
										<ConcertCard key={c.id} c={c} user={user} />
									))}
								</div>
							</div>
						)}

						{/* Passati */}
						{past.length > 0 && (
							<div>
								<div className="mb-4 flex items-center gap-3">
									<div className="h-px w-6 bg-white/10" />
									<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
										Passati ({past.length})
									</span>
								</div>
								<div className="flex flex-col gap-3">
									{displayedPast.map((c) => (
										<ConcertCard key={c.id} c={c} user={user} />
									))}
								</div>
								{past.length > 5 && !showAllPast && (
									<button
										onClick={() => setShowAllPast(true)}
										className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-white/10 py-3 text-sm text-white/50 transition hover:text-white hover:border-white/25"
									>
										<ChevronDown className="h-4 w-4" />
										Mostra altri {past.length - 5} concerti
									</button>
								)}
							</div>
						)}
					</>
				)}

				{/* Carica altre pagine (se Setlist.fm ha più dati) */}
				{!loading && hasMore && (
					<button
						onClick={loadMore}
						disabled={loadingMore}
						className="mt-2 inline-flex w-full items-center justify-center gap-2 border border-white/10 py-3 text-sm text-white/50 transition hover:text-white hover:border-white/25 disabled:opacity-40"
					>
						{loadingMore ? (
							"Carico…"
						) : (
							<>
								<ChevronDown className="h-4 w-4" />
								Carica altri concerti
							</>
						)}
					</button>
				)}
			</div>
		</main>
	)
}

/* ── Card concerto (estratto) ── */
function ConcertCard({ c, user }: { c: Concert; user: any }) {
	return (
		<div className="border-l-2 border-white/10 bg-white/[0.02] py-4 pl-5 transition hover:border-[#FF2D6B]/30">
			<div className="font-semibold text-white [font-family:var(--font-display)]">{c.venue}</div>
			<div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/45">
				<span className="inline-flex items-center gap-1.5">
					<MapPin className="h-3.5 w-3.5" /> {c.city}
					{c.country ? ", " + c.country : ""}
				</span>
				<span className="inline-flex items-center gap-1.5">
					<Calendar className="h-3.5 w-3.5" /> {fmtDate(c.date)}
				</span>
			</div>
			{user ? (
				<div className="mt-3">
					<LogConcert concertId={c.id} />
				</div>
			) : (
				<Link
					href="/login"
					className="mt-3 inline-block text-sm text-white/50 underline hover:text-white transition"
				>
					Accedi per dire "c'ero"
				</Link>
			)}
		</div>
	)
}