"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArtistImage } from "@/components/artsit-image"
import { Search, ChevronRight } from "lucide-react"

type Artist = { mbid: string; name: string; info: string }

function SearchInner() {
	const params = useSearchParams()
	const initial = params.get("q") ?? ""
	const supabase = createClient()
	const [q, setQ] = useState(initial)
	const [results, setResults] = useState<Artist[]>([])
	const [trending, setTrending] = useState<Artist[]>([])
	const [loading, setLoading] = useState(false)
	const [loadingTrending, setLoadingTrending] = useState(true)

	// Carica artisti in tendenza (quelli con più log nel DB)
	useEffect(() => {
		const loadTrending = async () => {
			if (!supabase) { setLoadingTrending(false); return }
			const { data } = await supabase
				.from("logs")
				.select("concert:concerts(artist:artists(mbid, name))")
				.limit(200)
			const rows = (data ?? []) as unknown as Array<{
				concert: { artist: { mbid: string; name: string } | null } | null
			}>
			const freq = new Map<string, { name: string; count: number }>()
			for (const r of rows) {
				const a = r.concert?.artist
				if (!a?.mbid || !a.name) continue
				const existing = freq.get(a.mbid)
				if (existing) existing.count++
				else freq.set(a.mbid, { name: a.name, count: 1 })
			}
			const sorted = [...freq.entries()]
				.sort((a, b) => b[1].count - a[1].count)
				.slice(0, 12)
				.map(([mbid, v]) => ({ mbid, name: v.name, info: v.count + " concerti" }))
			setTrending(sorted)
			setLoadingTrending(false)
		}
		loadTrending()
	}, [supabase])

	// Ricerca
	useEffect(() => {
		if (!initial) return
		search(initial)
	}, [initial])

	const search = async (term: string) => {
		if (!term.trim()) return
		setLoading(true)
		try {
			const res = await fetch("/api/search-artists?q=" + encodeURIComponent(term))
			if (!res.ok) { setResults([]); setLoading(false); return }
			const data = await res.json()
			setResults(data.artists ?? [])
		} catch { setResults([]) }
		setLoading(false)
	}

	const hasResults = results.length > 0
	const showTrending = !hasResults && !loading && trending.length > 0

	return (
		<main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
			<div className="mb-8 flex items-center gap-3">
				<div className="h-px w-6 bg-white/10" />
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Cerca</span>
			</div>

			{/* Barra di ricerca */}
			<div className="mb-8">
				<div className="relative">
					<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && search(q)}
						placeholder="Cerca un artista…"
						className="w-full border-b-2 border-white/10 bg-transparent py-4 pl-12 pr-4 text-lg outline-none transition placeholder:text-white/30 focus:border-[#FF2D6B]"
					/>
					{q && (
						<button
    onClick={() => { setQ(""); setResults([]) }}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/30 hover:text-white"
    aria-label="Cancella ricerca"
>
    ✕
</button>
					)}
				</div>
			</div>

			{/* Caricamento */}
			{loading && (
				<div className="flex flex-col gap-2">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="h-16 animate-pulse border-l-2 border-white/5 bg-white/[0.02]" />
					))}
				</div>
			)}

			{/* Risultati */}
			{hasResults && (
				<div className="flex flex-col gap-2">
					{results.map((a) => (
						<Link
							key={a.mbid}
							href={"/artist/" + a.mbid}
							className="group flex items-center gap-4 border-l-2 border-white/10 bg-white/[0.02] py-4 pl-5 transition hover:border-[#FF2D6B]/40 hover:bg-white/[0.04]"
						>
							<div className="h-14 w-11 shrink-0 overflow-hidden">
								<ArtistImage name={a.name} mbid={a.mbid} className="h-full w-full" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">
									{a.name}
								</p>
								{a.info && <p className="text-xs text-white/40">{a.info}</p>}
							</div>
							<ChevronRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-white/50 transition-colors" />
						</Link>
					))}
				</div>
			)}

			{/* Ricerca vuota */}
			{q && !loading && !hasResults && (
				<div className="border-l-2 border-white/5 py-4 pl-5 text-white/40">
					Nessun artista trovato per "{q}".
				</div>
			)}

			{/* Artisti in tendenza (quando non c'è una ricerca attiva) */}
			{showTrending && (
				<div>
					<div className="mb-5 flex items-center gap-3">
						<div className="h-px w-6 bg-white/10" />
						<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
							I più cercati
						</span>
					</div>

					{loadingTrending ? (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{[...Array(6)].map((_, i) => (
								<div key={i} className="h-20 animate-pulse bg-white/[0.03]" />
							))}
						</div>
					) : (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{trending.map((a) => (
								<Link
									key={a.mbid}
									href={"/artist/" + a.mbid}
									className="group flex flex-col items-center gap-3 border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#FF2D6B]/40 hover:bg-white/[0.04]"
								>
									<div className="h-20 w-20 overflow-hidden rounded-full">
										<ArtistImage name={a.name} mbid={a.mbid} className="h-full w-full" />
									</div>
									<div className="text-center">
										<p className="text-sm font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">
											{a.name}
										</p>
										{a.info && (
											<p className="text-xs text-white/40 mt-0.5">{a.info}</p>
										)}
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			)}
		</main>
	)
}

export default function SearchPage() {
	return (
		<Suspense fallback={<main className="p-6">Carico…</main>}>
			<SearchInner />
		</Suspense>
	)
}