"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ConcertPoster } from "@/components/concert-poster"
import { PosterGridSkeleton } from "@/components/skeleton"
import { ProfileHeader } from "@/components/profile-header"
import { ArtistImage } from "@/components/artsit-image"
import { LogOut, Sparkles, Ticket, Search, ChevronRight, Star, TrendingUp, MapPin, Music, Plus } from "lucide-react"

type Profile = {
	id: string; username: string | null; display_name: string | null
	avatar_url: string | null; bio: string | null; city: string | null
}

type Log = {
	id: string; rating: number | null; review: string | null; concert_id: string
	concerts: { date: string | null; artists: { name: string } | null; venues: { name: string; city: string | null } | null } | null
}

type ArtistResult = { mbid: string; name: string; info: string }

const fmtDate = (d: string | null): string =>
	d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""

const getYear = (d: string | null): string => d ? d.slice(0, 4) : "Sconosciuto"

export default function ProfilePage() {
	const { user, loading } = useUser()
	const router = useRouter()
	const [profile, setProfile] = useState<Profile | null>(null)
	const [logs, setLogs] = useState<Log[]>([])
	const [loadingLogs, setLoadingLogs] = useState(true)
	const [rsvpCount, setRsvpCount] = useState(0)

	const [showQuickSearch, setShowQuickSearch] = useState(false)
	const [searchQ, setSearchQ] = useState("")
	const [searchResults, setSearchResults] = useState<ArtistResult[]>([])
	const [searchLoading, setSearchLoading] = useState(false)
	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		if (!user) return
		const supabase = createClient()
		if (!supabase) return

		supabase.from("profiles")
			.select("id, username, display_name, avatar_url, bio, city")
			.eq("id", user.id).maybeSingle()
			.then(({ data }) => {
				if (data && !data.username) { router.push("/onboarding"); return }
				setProfile((data as unknown as Profile) ?? null)
			})

		supabase.from("logs")
			.select("id, rating, review, concert_id, concerts(date, artists(name), venues(name, city))")
			.eq("user_id", user.id).order("logged_at", { ascending: false })
			.then(({ data }) => {
				setLogs((data as unknown as Log[]) ?? [])
				setLoadingLogs(false)
			})

		supabase.from("rsvps").select("concert_id").eq("user_id", user.id)
			.then(async ({ data: rsvps }) => {
				if (!rsvps || rsvps.length === 0) { setRsvpCount(0); return }
				const ids = (rsvps as Array<{ concert_id: string }>).map((r) => r.concert_id)
				const today = new Date().toISOString().slice(0, 10)
				const { data: concerts } = await supabase.from("concerts").select("id, date").in("id", ids).gte("date", today)
				setRsvpCount((concerts ?? []).length)
			})
	}, [user])

	const doSearch = async (term: string) => {
		if (!term.trim() || term.trim().length < 2) { setSearchResults([]); return }
		setSearchLoading(true)
		try {
			const res = await fetch("/api/search-artists?q=" + encodeURIComponent(term))
			if (res.ok) { const data = await res.json(); setSearchResults(data.artists ?? []) }
			else setSearchResults([])
		} catch { setSearchResults([]) }
		setSearchLoading(false)
	}

	const handleSearchChange = (value: string) => {
		setSearchQ(value)
		if (searchTimer.current) clearTimeout(searchTimer.current)
		searchTimer.current = setTimeout(() => doSearch(value), 300)
	}

	const handleLogout = async () => {
		const supabase = createClient()
		if (!supabase) return
		await supabase.auth.signOut()
		router.push("/")
	}

	const stats = useMemo(() => {
		if (logs.length === 0) return null
		const total = logs.length
		const rated = logs.filter((l) => l.rating != null)
		const avg = rated.length > 0
			? (rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length).toFixed(1)
			: "—"
		const artFreq = new Map<string, number>()
		const cityFreq = new Map<string, number>()
		for (const l of logs) {
			const a = l.concerts?.artists?.name; if (a) artFreq.set(a, (artFreq.get(a) ?? 0) + 1)
			const c = l.concerts?.venues?.city; if (c) cityFreq.set(c, (cityFreq.get(c) ?? 0) + 1)
		}
		const topArtist = [...artFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
		const topCity = [...cityFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
		return { total, avg, topArtist, topCity }
	}, [logs])

	const byYear = useMemo(() => {
		const map = new Map<string, Log[]>()
		for (const l of logs) {
			const y = getYear(l.concerts?.date ?? null)
			if (!map.has(y)) map.set(y, [])
			map.get(y)!.push(l)
		}
		return [...map.entries()].sort((a, b) => Number(b[0]) - Number(a[0]))
	}, [logs])

	if (loading) return <main className="p-6">Carico…</main>
	if (!user) return (
		<main className="p-6"><Link href="/login" className="underline">Accedi</Link> per vedere i tuoi concerti.</main>
	)

	const year = new Date().getFullYear()

	return (
		<main className="pb-20 sm:pb-10">
			{profile && <ProfileHeader profile={profile} isOwner={true} />}

			<div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">

				{stats && (
					<div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<StatCard label="Concerti" value={String(stats.total)} icon={Music} />
						<StatCard label="Media voto" value={stats.avg + "/5"} icon={Star} color="text-[#FFC24B]" />
						<StatCard label="Top artista" value={stats.topArtist ?? "—"} icon={TrendingUp} />
						<StatCard label="Top città" value={stats.topCity ?? "—"} icon={MapPin} />
					</div>
				)}

				<div className="mb-8 flex flex-wrap items-center gap-3">
					<button
						onClick={() => setShowQuickSearch(!showQuickSearch)}
						className="inline-flex items-center gap-2 bg-[#FF2D6B] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
					>
						<Plus className="h-4 w-4" /> Aggiungi concerto
					</button>
					{rsvpCount > 0 && (
						<Link href="/me/rsvps" className="inline-flex items-center gap-2 border border-[#FFC24B]/30 px-5 py-2.5 text-sm font-medium text-[#FFC24B] transition hover:border-[#FFC24B]/60">
							<Ticket className="h-4 w-4" /> {rsvpCount} {rsvpCount === 1 ? "concerto" : "concerti"} in programma
						</Link>
					)}
					{logs.length > 0 && (
						<Link href={"/api/wrapped/" + user.id} target="_blank" className="inline-flex items-center gap-2 border border-white/15 px-5 py-2.5 text-sm font-medium text-white/50 transition hover:border-white/40 hover:text-white">
							<Sparkles className="h-4 w-4" /> Wrapped {year}
						</Link>
					)}
				</div>

				{showQuickSearch && (
					<div className="mb-8">
						<div className="relative mb-4">
							<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
							<input
								value={searchQ}
								onChange={(e) => handleSearchChange(e.target.value)}
								placeholder="Cerca un artista per aggiungere un concerto…"
								autoComplete="off"
								className="w-full border-b-2 border-white/10 bg-transparent py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-white/30 focus:border-[#FF2D6B]"
							/>
						</div>
						{searchLoading && <p className="text-sm text-white/30">Cerco…</p>}
						{searchResults.length > 0 && (
							<div className="flex flex-col gap-1 mb-4">
								{searchResults.slice(0, 6).map((a) => (
									<Link key={a.mbid} href={"/artist/" + a.mbid}
										className="flex items-center gap-3 border-l-2 border-white/10 bg-white/[0.02] py-2.5 pl-4 pr-3 transition hover:border-[#FF2D6B]/40 hover:bg-white/[0.04]">
										<div className="h-10 w-8 shrink-0 overflow-hidden"><ArtistImage name={a.name} mbid={a.mbid} className="h-full w-full" /></div>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-semibold text-white [font-family:var(--font-display)]">{a.name}</p>
											{a.info && <p className="text-xs text-white/40">{a.info}</p>}
										</div>
										<ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
									</Link>
								))}
							</div>
						)}
					</div>
				)}

				{loadingLogs ? (
					<PosterGridSkeleton />
				) : logs.length === 0 ? (
					<div className="border border-white/10 bg-white/[0.02] p-10 text-center">
						<Music className="mx-auto mb-3 h-8 w-8 text-white/20" />
						<p className="text-white/40">Il tuo diario è vuoto.</p>
						<p className="mt-1 text-sm text-white/25">
							Clicca "Aggiungi concerto" qui sopra e cerca il primo artista che hai visto dal vivo.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-8">
						{byYear.map(([yearLabel, yearLogs]) => (
							<div key={yearLabel} id={"year-" + yearLabel}>
								<div className="mb-3 flex items-center gap-3">
									<div className="h-px w-6 bg-white/10" />
									<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
										{yearLabel} ({yearLogs.length})
									</span>
								</div>
								<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
									{yearLogs.map((l) => (
										<ConcertPoster
											key={l.id}
											concertId={l.concert_id}
											artist={l.concerts?.artists?.name ?? "Artista"}
											rating={l.rating}
											subtitle={l.concerts?.venues?.city ?? fmtDate(l.concerts?.date ?? null) ?? ""}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				)}

				<section className="mt-12 border-t border-white/10 pt-6 flex justify-end">
					<button onClick={handleLogout} className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white">
						<LogOut className="h-4 w-4" /> Esci
					</button>
				</section>
			</div>
		</main>
	)
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color?: string }) {
	return (
		<div className="border border-white/10 bg-white/[0.02] p-4">
			<div className="mb-2">
				<Icon className={`h-4 w-4 ${color || "text-white/30"}`} />
			</div>
			<div className={`text-xl font-bold [font-family:var(--font-display)] ${color || "text-white"}`}>
				{value}
			</div>
			<div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/30">{label}</div>
		</div>
	)
}