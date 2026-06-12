"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { useGeolocation } from "@/lib/use-geolocation"
import { MapPin, Users, ChevronRight, Navigation, Calendar, Loader2 } from "lucide-react"

const ConcertMap = dynamic(
	() => import("@/components/concert-map").then((m) => ({ default: m.ConcertMap })),
	{
		ssr: false,
		loading: () => (
			<div className="h-[420px] w-full flex items-center justify-center bg-[#17171F] border border-white/10">
				<Loader2 className="h-6 w-6 animate-spin text-white/30" />
			</div>
		),
	},
)

type ProfileCard = {
	userId: string
	username: string
	displayName: string
	avatarUrl: string | null
	bio: string | null
	profileCity: string | null
	venueCities: string[]
	concertCount: number
}

type NearbyConcert = {
	id: string
	date: string | null
	artistName: string
	artistMbid: string | null
	venueName: string
	city: string
	country: string
	lat: number | null
	lng: number | null
	distanceKm: number | null
	artistImage: string | null
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLng = ((lng2 - lng1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchArtistImage(mbid: string | null, name: string): Promise<string | null> {
	try {
		const url = mbid
			? "/api/artist-image?mbid=" + encodeURIComponent(mbid) + "&q=" + encodeURIComponent(name)
			: "/api/artist-image?q=" + encodeURIComponent(name)
		const res = await fetch(url)
		if (!res.ok) return null
		const data = await res.json()
		return data.image ?? null
	} catch { return null }
}

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""

export default function NearbyPage() {
	const { user } = useUser()
	const supabase = createClient()
	const geo = useGeolocation()
	const [groups, setGroups] = useState<Map<string, ProfileCard[]>>(new Map())
	const [nearbyConcerts, setNearbyConcerts] = useState<NearbyConcert[]>([])
	const [loading, setLoading] = useState(true)
	const [imagesLoaded, setImagesLoaded] = useState(false)

	const userLat = geo.lat ?? null
	const userLng = geo.lng ?? null

	// Fetch concerti da Setlist.fm per la città rilevata (o fallback Italia)
	useEffect(() => {
		const loadConcerts = async () => {
			if (!supabase) return
			const params = new URLSearchParams()
			if (geo.city) params.set("city", geo.city)
			else if (userLat && userLng) { params.set("lat", String(userLat)); params.set("lng", String(userLng)) }
			try {
				const res = await fetch("/api/nearby-concerts?" + params.toString())
				const data = await res.json()
				const raw: NearbyConcert[] = (data.concerts ?? []).map((c: any) => ({
					...c,
					distanceKm:
						userLat && userLng && c.lat != null && c.lng != null
							? haversineDistance(userLat, userLng, c.lat, c.lng)
							: null,
					artistImage: null,
				}))
				// Ordina per data
				raw.sort((a, b) => (a.date ?? "z").localeCompare(b.date ?? "z"))
				setNearbyConcerts(raw)
			} catch { setNearbyConcerts([]) }
		}
		if (!geo.loading) loadConcerts()
	}, [supabase, geo.city, geo.loading, userLat, userLng])

	// Fetch profili + raggruppa per città
	useEffect(() => {
		const loadProfiles = async () => {
			if (!supabase) { setLoading(false); return }
			const { data: allLogs } = await supabase
				.from("logs")
				.select("user_id, profiles(username, display_name, avatar_url, bio, city), concerts(venues(city))")
				.not("profiles", "is", null)
				.order("logged_at", { ascending: false })
			const rows = (allLogs as unknown as any[]) ?? []
			const byUser = new Map<string, ProfileCard>()
			for (const row of rows) {
				const p = row.profiles; if (!p?.username) continue
				const existing = byUser.get(row.user_id)
				const vc = row.concerts?.venues?.city ?? null
				if (existing) { existing.concertCount++; if (vc && !existing.venueCities.includes(vc)) existing.venueCities.push(vc) }
				else byUser.set(row.user_id, { userId: row.user_id, username: p.username, displayName: p.display_name || p.username, avatarUrl: p.avatar_url, bio: p.bio, profileCity: p.city, venueCities: vc ? [vc] : [], concertCount: 1 })
			}
			const grouped = new Map<string, ProfileCard[]>()
			for (const card of byUser.values()) {
				const city = card.venueCities[0] || card.profileCity || "Ovunque"
				if (!grouped.has(city)) grouped.set(city, [])
				grouped.get(city)!.push(card)
			}
			const sorted = new Map<string, ProfileCard[]>()
			if (geo.city) {
				const match = [...grouped.keys()].find((k) => geo.city && k.toLowerCase() === geo.city.toLowerCase())
				if (match) { sorted.set(match, grouped.get(match)!); grouped.delete(match) }
			}
			for (const [city, cards] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])))
				sorted.set(city, cards)
			setGroups(sorted)
			setLoading(false)
		}
		if (!geo.loading) loadProfiles()
	}, [supabase, geo.city, geo.loading])

	// Fetch immagini artista per i concerti trovati
	useEffect(() => {
		if (nearbyConcerts.length === 0 || imagesLoaded) return
		(async () => {
			const results = await Promise.all(
				nearbyConcerts.map(async (c) => {
					const img = await fetchArtistImage(c.artistMbid, c.artistName)
					return { id: c.id, img }
				})
			)
			setNearbyConcerts((prev) => prev.map((c) => {
				const hit = results.find((r) => r.id === c.id)
				return hit?.img ? { ...c, artistImage: hit.img } : c
			}))
			setImagesLoaded(true)
		})()
	}, [nearbyConcerts.length > 0 && !imagesLoaded])

	const mapMarkers = useMemo(() =>
		nearbyConcerts.filter((c) => c.lat != null && c.lng != null).map((c) => ({
			id: c.id,
			lat: c.lat!,
			lng: c.lng!,
			name: c.artistName,
			venue: c.venueName,
			date: c.date ?? "",
			city: c.city,
			rsvpCount: 0, // I RSVP sono su DB locale, qui non ci sono
			artistImage: c.artistImage,
		})),
	[nearbyConcerts])

	if (loading || geo.loading) return <main className="mx-auto max-w-2xl p-6">Carico…</main>

	return (
		<main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
			<div className="mb-6 flex items-center gap-3">
				<div className="h-px w-6 bg-white/10" />
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Vicino a te</span>
			</div>
			<h1 className="mb-1 text-3xl font-bold [font-family:var(--font-display)]">Cosa succede vicino a te</h1>
			{geo.city ? (
				<p className="mb-8 flex items-center gap-1.5 text-sm text-[#FF2D6B]">
					<Navigation className="h-3.5 w-3.5" /> Rilevata: {geo.city ?? ""}
				</p>
			) : (
				<p className="mb-8 text-sm text-white/40">
					{geo.error || "Concedi la geolocalizzazione per vedere i concerti vicino a te."}
				</p>
			)}

			{/* MAPPA */}
			{mapMarkers.length > 0 && (
				<section className="mb-10">
					<div className="mb-4 flex items-center gap-2">
						<MapPin className="h-4 w-4 text-[#FF2D6B]" />
						<h2 className="text-lg font-bold text-white [font-family:var(--font-display)]">Concerti in programma</h2>
						<span className="text-xs text-white/30">{mapMarkers.length}</span>
					</div>
					<ConcertMap markers={mapMarkers} userLat={userLat} userLng={userLng} />
				</section>
			)}

			{/* LISTA CONCERTI */}
			{nearbyConcerts.length > 0 && (
				<section className="mb-10">
					<div className="mb-4 flex items-center gap-2">
						<Calendar className="h-4 w-4 text-[#FFC24B]" />
						<h2 className="text-lg font-bold text-white [font-family:var(--font-display)]">
							{geo.city ? "Prossimi a " + geo.city : "Prossimi in Italia"}
						</h2>
					</div>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{nearbyConcerts.map((c) => (
							<Link key={c.id} href={"/concert/" + c.id}
								className="group flex items-center gap-4 border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25 hover:bg-white/[0.04]">
								<div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#17171F] text-white/30">
									<Calendar className="h-5 w-5" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">{c.artistName}</p>
									<p className="text-sm text-white/50">{c.venueName}{c.city ? ", " + c.city : ""}</p>
									<div className="mt-1 flex items-center gap-3 text-xs">
										<span className="text-white/40">{fmtDate(c.date)}</span>
										{c.distanceKm != null && <span className="text-white/30">{Math.round(c.distanceKm)} km</span>}
									</div>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* PERSONE PER CITTÀ */}
			{[...groups.entries()].length === 0 ? (
				<div className="border border-white/10 bg-white/[0.02] p-10 text-center">
					<Users className="mx-auto mb-3 h-8 w-8 text-white/20" />
					<p className="text-white/40">Nessun profilo ancora. Logga un concerto per comparire qui.</p>
				</div>
			) : (
				<div className="flex flex-col gap-10">
					{[...groups.entries()].map(([city, profiles]) => (
						<section key={city}>
							<div className="mb-3 flex items-center gap-2">
								<MapPin className="h-4 w-4 text-[#FF2D6B]" />
								<h2 className="text-lg font-bold text-white [font-family:var(--font-display)]">
									{city}
									{geo.city && geo.city.toLowerCase() === city.toLowerCase() && (
										<span className="ml-2 text-xs font-normal text-[#FF2D6B] uppercase tracking-wider">La tua zona</span>
									)}
								</h2>
								<span className="text-xs text-white/30">{profiles.length}</span>
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								{profiles.map((card) => {
									const initials = card.displayName.trim().slice(0, 2).toUpperCase()
									return (
										<Link key={card.userId} href={"/u/" + card.username}
											className="group flex items-center gap-4 border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25 hover:bg-white/[0.04]">
											{card.avatarUrl ? <img src={card.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
												: <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D6B]/60 to-[#7A5CFF]/60 text-sm font-bold text-white">{initials}</div>}
											<div className="min-w-0 flex-1">
												<span className="font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">{card.displayName}</span>
												<p className="text-xs text-white/40">@{card.username}</p>
												<div className="mt-1 text-xs text-white/30">{card.concertCount} {card.concertCount === 1 ? "concerto" : "concerti"}</div>
											</div>
											<ChevronRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-white/50 transition-colors" />
										</Link>
									)
								})}
							</div>
						</section>
					))}
				</div>
			)}
		</main>
	)
}