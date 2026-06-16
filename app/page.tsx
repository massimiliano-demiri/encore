"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Navigation, MapPin, TrendingUp, Star, Music } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { useGeolocation } from "@/lib/use-geolocation"
import { ArtistImage } from "@/components/artsit-image"
import { ConcertPoster } from "@/components/concert-poster"

type UpcomingEvent = {
	id: string; date: string | null; artistName: string; artistMbid: string | null
	venueName: string; city: string; lat: number | null; lng: number | null
	distanceKm: number | null; artistImage: string | null; ticketUrl: string | null
	priceMin: number | null; priceCurrency: string | null
}

type TrendingArtist = { name: string; mbid: string | null; count: number }

type PersonalStats = {
	total: number
	avgRating: string
	topArtist: string | null
	topCity: string | null
}

type RecentLog = {
	id: string; concert_id: string; rating: number | null
	concerts: { artists: { name: string } | null; venues: { name: string; city: string | null } | null } | null
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLng = ((lng2 - lng1) * Math.PI) / 180
	const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""

const MAX_KM = 80

export default function Home() {
	const { user, loading: userLoading } = useUser()
	const geo = useGeolocation()
	const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
	const [trending, setTrending] = useState<TrendingArtist[]>([])
	const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([])
	const [stats, setStats] = useState<PersonalStats | null>(null)
	const [recentLogs, setRecentLogs] = useState<RecentLog[]>([])
	const [loading, setLoading] = useState(true)

	const userLat = geo.lat ?? null; const userLng = geo.lng ?? null; const userCity = geo.city ?? null

	useEffect(() => {
		if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) setSupabase(createClient())
	}, [])

	useEffect(() => {
		if (!supabase) { setLoading(false); return }

		const yearStart = new Date().getFullYear() + "-01-01"
		const today = new Date().toISOString().slice(0, 10)

		const tmParams = new URLSearchParams()
		if (userLat && userLng) { tmParams.set("lat", String(userLat)); tmParams.set("lng", String(userLng)); tmParams.set("radius", String(MAX_KM)) }

		const loadUpcoming = fetch("/api/ticketmaster-events?" + tmParams.toString()).then(r => r.ok ? r.json() : { events: [] })
		const loadTrending = supabase.from("logs").select("concerts(artists(name, mbid))").gte("logged_at", yearStart).limit(300)

		// Se loggato, fetch stat personali + ultimi log
		const loadPersonal = user
			? supabase.from("logs").select("id, rating, concert_id, concerts(artists(name), venues(name, city))").eq("user_id", user.id).order("logged_at", { ascending: false }).limit(6)
			: Promise.resolve({ data: null })

		Promise.all([loadTrending, loadUpcoming, loadPersonal]).then(([{ data: trendData }, tmData, personalData]) => {
			// Trending
			const rows = (trendData ?? []) as any[]
			const artistMap = new Map<string, { mbid: string | null; count: number }>()
			for (const row of rows) { const a = row.concerts?.artists; if (!a?.name) continue; const key = a.name.toLowerCase(); const e = artistMap.get(key); e ? (e.count++, (!e.mbid && a.mbid && (e.mbid = a.mbid))) : artistMap.set(key, { mbid: a.mbid, count: 1 }) }
			setTrending([...artistMap.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 12).map(([name, v]) => ({ name, mbid: v.mbid, count: v.count })))

			// Upcoming
			setUpcoming(((tmData.events ?? []) as any[]).map((c: any) => ({
				id: c.id, date: c.date, artistName: c.artistName, artistMbid: c.artistMbid, venueName: c.venueName, city: c.city,
				lat: c.lat, lng: c.lng, distanceKm: (userLat && userLng && c.lat && c.lng) ? haversineDistance(userLat, userLng, c.lat, c.lng) : null,
				artistImage: c.imageUrl ?? null, ticketUrl: c.ticketUrl ?? null, priceMin: c.priceMin ?? null, priceCurrency: c.priceCurrency ?? null,
			})).filter((c: UpcomingEvent) => c.date && c.date >= today).sort((a: UpcomingEvent, b: UpcomingEvent) => (a.date ?? "z").localeCompare(b.date ?? "z")))

			// Stats personali
			if (personalData.data && user) {
				const logs = personalData.data as any[]
				setRecentLogs(logs.slice(0, 6) as RecentLog[])
				const rated = logs.filter((l: any) => l.rating != null)
				const avg = rated.length > 0 ? (rated.reduce((s: number, l: any) => s + l.rating, 0) / rated.length).toFixed(1) : "—"

				const artFreq = new Map<string, number>(); const cityFreq = new Map<string, number>()
				for (const l of logs) { const a = l.concerts?.artists?.name; if (a) artFreq.set(a, (artFreq.get(a) ?? 0) + 1); const c = l.concerts?.venues?.city; if (c) cityFreq.set(c, (cityFreq.get(c) ?? 0) + 1) }
				const topA = [...artFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
				const topC = [...cityFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
				setStats({ total: logs.length, avgRating: avg, topArtist: topA, topCity: topC })
			}

			setLoading(false)
		})
	}, [supabase, userLat, userLng, user])

	if (loading || userLoading) return null

	return (
		<main className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">

			{/* ── HEADER ── */}
			<div className="mb-8">
				{user ? (
					// LOGGATO: riepilogo personale
					<div>
						<p className="text-2xl font-bold [font-family:var(--font-display)]">
							Bentornat{user.user_metadata?.display_name ? "a" : "o"}
							{user.user_metadata?.display_name ? ", " + (user.user_metadata?.display_name as string).split(" ")[0] : ""}
						</p>
						{stats && stats.total > 0 && (
							<p className="mt-1 text-sm text-white/40">
								{stats.total} concerti · media {stats.avgRating}/5
								{stats.topArtist && <> · {stats.topArtist}</>}
								{stats.topCity && <> · {stats.topCity}</>}
							</p>
						)}
					</div>
				) : userCity ? (
					// NON LOGGATO CON GPS
					<div>
						<p className="flex items-center gap-2 text-2xl font-bold [font-family:var(--font-display)]">
							<Navigation className="h-5 w-5 text-[#FF2D6B]" /> {userCity}
						</p>
						<p className="mt-1 text-sm text-white/40">{upcoming.length} concerti {userLat && userLng ? "entro " + MAX_KM + "km" : "in Italia"}</p>
					</div>
				) : (
					// NON LOGGATO SENZA GPS
					<div>
						<p className="text-2xl font-bold [font-family:var(--font-display)]">Cosa succede vicino a te</p>
						<p className="mt-1 text-sm text-white/40">
							<Link href="/login" className="text-[#FF2D6B] hover:underline">Accedi</Link> o concedi la geolocalizzazione.
						</p>
						<div className="mt-4 flex gap-3">
							<Link href="/signup" className="bg-[#FF2D6B] px-5 py-2 text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110">Inizia gratis</Link>
							<Link href="/login" className="border border-white/15 px-5 py-2 text-sm font-medium text-white/60 transition hover:border-white/40 hover:text-white">Accedi</Link>
						</div>
					</div>
				)}
			</div>

			{/* ── ULTIMI CONCERTI LOGGATI (solo per loggati con storico) ── */}
			{user && recentLogs.length > 0 && (
				<section className="mb-12">
					<div className="mb-5 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-px w-6 bg-white/10" />
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Il tuo diario</span>
						</div>
						<Link href="/me" className="text-xs uppercase tracking-wider text-white/30 hover:text-[#FFC24B] transition">Vedi tutti →</Link>
					</div>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
						{recentLogs.map((l) => (
							<ConcertPoster key={l.id} concertId={l.concert_id} artist={l.concerts?.artists?.name ?? "Artista"} rating={l.rating} subtitle={l.concerts?.venues?.city ?? ""} />
						))}
					</div>
				</section>
			)}

			{/* ── PROSSIMI — card verticali ── */}
			{upcoming.length > 0 && (
				<section className="mb-12">
					<div className="mb-5 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-px w-6 bg-[#FFC24B]/40" />
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC24B]">
								Prossimi {userCity && !user ? "vicino a " + userCity : "in Italia"}
							</span>
						</div>
						<Link href="/nearby" className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-[#FFC24B] transition">
							<MapPin className="h-3 w-3" /> Radar completo
						</Link>
					</div>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
						{upcoming.slice(0, 8).map((c) => (
							<Link key={c.id} href={"/concert/" + c.id} className="group flex flex-col overflow-hidden border border-white/10 bg-white/[0.02] transition hover:border-white/25 hover:bg-white/[0.04]">
								<div className="relative aspect-[3/4] overflow-hidden bg-[#17171F]">
									{c.artistImage ? (
										<img src={c.artistImage} alt={c.artistName} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
									) : (
										<div className="flex h-full w-full items-center justify-center">
											<div className="text-center">
												<Calendar className="mx-auto h-8 w-8 text-white/10" />
												<p className="mt-2 px-2 text-xs font-bold uppercase tracking-wider text-white/15 [font-family:var(--font-display)]">{c.artistName}</p>
											</div>
										</div>
									)}
									<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0E0E12] to-transparent" />
									{c.priceMin != null && <div className="absolute left-2 top-2 bg-black/60 backdrop-blur px-2 py-0.5 text-xs font-bold text-[#FFC24B]">da {c.priceMin}{c.priceCurrency === "EUR" ? "€" : ""}</div>}
									{c.distanceKm != null && <div className="absolute right-2 top-2 bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] text-white/50">{Math.round(c.distanceKm)} km</div>}
								</div>
								<div className="p-3">
									<p className="truncate text-sm font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">{c.artistName}</p>
									<p className="mt-0.5 truncate text-xs text-white/45"><MapPin className="inline h-3 w-3 mr-0.5 opacity-50" />{c.venueName}{c.city ? ", " + c.city : ""}</p>
									<p className="mt-1 text-xs text-white/30"><Calendar className="inline h-3 w-3 mr-0.5 opacity-50" />{fmtDate(c.date)}</p>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* ── TOP TREND ── */}
			{trending.length > 0 && (
				<section className="mb-12">
					<div className="mb-5 flex items-center justify-between">
						<div className="flex items-center gap-3"><div className="h-px w-6 bg-white/10" /><span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Top trend {new Date().getFullYear()}</span></div>
						<Link href="/search" className="text-xs uppercase tracking-wider text-white/30 hover:text-[#FFC24B] transition">Esplora artisti →</Link>
					</div>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
						{trending.map((a) => (
							<Link key={a.name} href={"/artist/" + (a.mbid || encodeURIComponent(a.name))} className="group flex flex-col gap-2 border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/25 hover:bg-white/[0.04]">
								<div className="aspect-square w-full overflow-hidden"><ArtistImage name={a.name} mbid={a.mbid ?? undefined} className="h-full w-full" /></div>
								<div className="text-center">
									<p className="truncate text-xs font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">{a.name}</p>
									<p className="mt-0.5 text-[10px] text-white/35"><TrendingUp className="inline h-3 w-3 mr-0.5" />{a.count} {a.count === 1 ? "live" : "live"}</p>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{upcoming.length === 0 && trending.length === 0 && (
				<div className="py-20 text-center">
					<p className="text-white/30">Ancora nessun concerto.</p>
					{!user && <Link href="/signup" className="mt-3 inline-block text-sm text-[#FF2D6B] hover:underline">Registrati e inizia a esplorare</Link>}
				</div>
			)}
		</main>
	)
}