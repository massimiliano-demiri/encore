"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { useGeolocation } from "@/lib/use-geolocation"
import { MapPin, Users, Navigation, Calendar, Loader2, Ticket } from "lucide-react"

const ConcertMap = dynamic(
	() => import("@/components/concert-map").then((m) => ({ default: m.ConcertMap })),
	{
		ssr: false,
		loading: () => (
			<div className="h-[400px] w-full flex items-center justify-center bg-[#17171F] border border-white/10">
				<Loader2 className="h-6 w-6 animate-spin text-white/30" />
			</div>
		),
	},
)

type ProfileCard = {
	userId: string; username: string; displayName: string; avatarUrl: string | null
	bio: string | null; profileCity: string | null; venueCities: string[]; concertCount: number
}

type NearbyConcert = {
	id: string; date: string | null; artistName: string; artistMbid: string | null
	venueName: string; city: string; country: string; lat: number | null; lng: number | null
	distanceKm: number | null; artistImage: string | null
	source: "setlistfm" | "db" | "ticketmaster"; ticketUrl: string | null
	priceMin: number | null; priceCurrency: string | null
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLng = ((lng2 - lng1) * Math.PI) / 180
	const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchArtistImage(mbid: string | null, name: string): Promise<string | null> {
	try {
		const url = mbid ? "/api/artist-image?mbid=" + encodeURIComponent(mbid) + "&q=" + encodeURIComponent(name) : "/api/artist-image?q=" + encodeURIComponent(name)
		const res = await fetch(url); if (!res.ok) return null
		return (await res.json()).image ?? null
	} catch { return null }
}

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""
const MAX_KM = 50

export default function NearbyPage() {
	const { user } = useUser()
	const supabase = createClient()
	const geo = useGeolocation()
	const [groups, setGroups] = useState<Map<string, ProfileCard[]>>(new Map())
	const [nearbyConcerts, setNearbyConcerts] = useState<NearbyConcert[]>([])
	const [pastConcerts, setPastConcerts] = useState<NearbyConcert[]>([])
	const [loading, setLoading] = useState(true)
	const [imagesLoaded, setImagesLoaded] = useState(false)
	const [errors, setErrors] = useState<string[]>([])
	const [profileCity, setProfileCity] = useState<string | null>(null)

	useEffect(() => {
		if (!supabase || !user) return
		supabase.from("profiles").select("city").eq("id", user.id).maybeSingle().then(({ data }) => {
			setProfileCity((data as any)?.city ?? null)
		})
	}, [supabase, user])

	const userCity = geo.city || profileCity
	const userLat = geo.lat ?? null
	const userLng = geo.lng ?? null

	useEffect(() => {
		const load = async () => {
			if (!supabase) { setLoading(false); return }
			const today = new Date().toISOString().slice(0, 10)
			const sfParams = new URLSearchParams(); if (geo.city) sfParams.set("city", geo.city)
			const tmParams = new URLSearchParams()
			if (userLat && userLng) { tmParams.set("lat", String(userLat)); tmParams.set("lng", String(userLng)); tmParams.set("radius", String(MAX_KM)) }

			const results = await Promise.allSettled([
				fetch("/api/nearby-concerts?" + sfParams).then(r => r.ok ? r.json() : { concerts: [] }),
				supabase.from("concerts").select("id, date, artists(name, mbid), venues(name, city, lat, lng)").order("date", { ascending: true }).limit(100),
				fetch("/api/ticketmaster-events?" + tmParams).then(r => r.ok ? r.json() : { events: [] }),
			])
			const newErrors: string[] = []
if (results[0].status === "rejected") newErrors.push("Setlist.fm non disponibile")
if (results[1].status === "rejected") newErrors.push("Database non disponibile")
if (results[2].status === "rejected") newErrors.push("Ticketmaster non disponibile")
setErrors(newErrors)

			const sfRes = results[0].status === "fulfilled" ? results[0].value : { concerts: [] }
			const dbResult = results[1].status === "fulfilled" ? results[1].value : { data: [] }
			const tmRes = results[2].status === "fulfilled" ? results[2].value : { events: [] }

			const { data: dbConcerts } = dbResult as { data: any[] | null }

			const tmItems: NearbyConcert[] = ((tmRes.events ?? []) as any[]).map((c: any) => ({
				id: c.id, date: c.date, artistName: c.artistName, artistMbid: c.artistMbid, venueName: c.venueName, city: c.city, country: c.country,
				lat: c.lat, lng: c.lng, distanceKm: null, artistImage: c.imageUrl ?? null, source: "ticketmaster" as const, ticketUrl: c.ticketUrl ?? null,
				priceMin: c.priceMin ?? null, priceCurrency: c.priceCurrency ?? null,
			}))
			const sfItems: NearbyConcert[] = ((sfRes.concerts ?? []) as any[]).map((c: any) => ({
				id: c.id, date: c.date, artistName: c.artistName, artistMbid: c.artistMbid, venueName: c.venueName, city: c.city, country: c.country,
				lat: c.lat, lng: c.lng, distanceKm: null, artistImage: null, source: "setlistfm" as const, ticketUrl: null, priceMin: null, priceCurrency: null,
			}))
			const dbItems: NearbyConcert[] = ((dbConcerts ?? []) as any[]).map((c: any) => ({
				id: c.id, date: c.date, artistName: c.artists?.name ?? "Artista", artistMbid: c.artists?.mbid ?? null,
				venueName: c.venues?.name ?? "", city: c.venues?.city ?? "", country: "", lat: c.venues?.lat ?? null, lng: c.venues?.lng ?? null,
				distanceKm: null, artistImage: null, source: "db" as const, ticketUrl: null, priceMin: null, priceCurrency: null,
			}))

			const seen = new Set<string>(); const merged: NearbyConcert[] = []
			for (const c of [...tmItems, ...sfItems, ...dbItems]) {
				const key = c.artistName + "|" + c.venueName + "|" + c.date; if (seen.has(key)) continue; seen.add(key)
				if (c.lat && c.lng && userLat && userLng) c.distanceKm = haversineDistance(userLat, userLng, c.lat, c.lng)
				merged.push(c)
			}

			const inRadius = (list: NearbyConcert[]) => {
				if (!userLat || !userLng) return list
				return list.filter(c => { if (!c.lat || !c.lng) return true; return haversineDistance(userLat, userLng, c.lat, c.lng) <= MAX_KM })
			}

			setNearbyConcerts(inRadius(merged.filter(c => c.date && c.date >= today).sort((a, b) => (a.date ?? "z").localeCompare(b.date ?? "z"))))
			setPastConcerts(inRadius(merged.filter(c => c.date && c.date < today).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))))
			setLoading(false)
		}
		if (!geo.loading) load()
	}, [supabase, geo.city, geo.loading, userLat, userLng])

	useEffect(() => {
		if (!supabase || geo.loading) return;
		(async () => {
			const { data: allLogs } = await supabase.from("logs").select("user_id, profiles(username, display_name, avatar_url, bio, city), concerts(venues(city))").not("profiles", "is", null).order("logged_at", { ascending: false })
			const rows = (allLogs as any[]) ?? []; const byUser = new Map<string, ProfileCard>()
			for (const row of rows) { const p = row.profiles; if (!p?.username) continue; const e = byUser.get(row.user_id); const vc = row.concerts?.venues?.city ?? null
				if (e) { e.concertCount++; if (vc && !e.venueCities.includes(vc)) e.venueCities.push(vc) }
				else byUser.set(row.user_id, { userId: row.user_id, username: p.username, displayName: p.display_name || p.username, avatarUrl: p.avatar_url, bio: p.bio, profileCity: p.city, venueCities: vc ? [vc] : [], concertCount: 1 })
			}
			const grouped = new Map<string, ProfileCard[]>(); for (const card of byUser.values()) { const c = card.venueCities[0] || card.profileCity || "Ovunque"; if (!grouped.has(c)) grouped.set(c, []); grouped.get(c)!.push(card) }
			const sorted = new Map<string, ProfileCard[]>()
			if (geo.city) { const m = [...grouped.keys()].find(k => geo.city && k.toLowerCase() === geo.city.toLowerCase()); if (m) { sorted.set(m, grouped.get(m)!); grouped.delete(m) } }
			for (const [city, cards] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) sorted.set(city, cards)
			setGroups(sorted)
		})()
	}, [supabase, geo.city, geo.loading])

	useEffect(() => {
		const items = [...nearbyConcerts, ...pastConcerts].filter(c => c.source !== "ticketmaster" && !c.artistImage)
		if (!items.length || imagesLoaded) return;
		(async () => {
			const results = await Promise.all(items.map(async c => ({ id: c.id, img: await fetchArtistImage(c.artistMbid, c.artistName) })))
			setNearbyConcerts(p => p.map(c => { const h = results.find(r => r.id === c.id); return h?.img ? { ...c, artistImage: h.img } : c }))
			setPastConcerts(p => p.map(c => { const h = results.find(r => r.id === c.id); return h?.img ? { ...c, artistImage: h.img } : c }))
			setImagesLoaded(true)
		})()
	}, [nearbyConcerts.length > 0 && !imagesLoaded])

	const allMapMarkers = useMemo(() =>
		nearbyConcerts.filter(c => c.lat && c.lng).map(c => ({
			id: c.id, lat: c.lat!, lng: c.lng!, name: c.artistName, venue: c.venueName, date: c.date ?? "", city: c.city,
			rsvpCount: 0, artistImage: c.artistImage, ticketUrl: c.ticketUrl, priceMin: c.priceMin ?? null, priceCurrency: c.priceCurrency ?? null,
		})), [nearbyConcerts])

	if (loading || geo.loading) return (
		<main className="mx-auto max-w-2xl p-6">
			<div className="flex flex-col gap-3">
				{[...Array(5)].map((_, i) => (<div key={i} className="h-20 animate-pulse border-l-2 border-white/5 bg-white/[0.02]" />))}
			</div>
		</main>
	)

	return (
		<main className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
			<div className="mb-5 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold [font-family:var(--font-display)]">Cosa succede vicino a te</h1>
					{userCity ? (
						<p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#FF2D6B]">
							<Navigation className="h-3.5 w-3.5" /> {geo.city ? "Rilevata: " + geo.city : "Città: " + userCity}{userLat && userLng && " · " + MAX_KM + "km"}
						</p>
					) : (
						<p className="mt-0.5 text-sm text-white/40">{!user ? "Accedi o concedi la geolocalizzazione." : geo.error || "Imposta la tua città nel profilo."}</p>
					)}
				</div>
				{!user && <Link href="/signup" className="shrink-0 bg-[#FF2D6B] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110">Inizia</Link>}
				{errors.length > 0 && (
	<div className="mb-6 border-l-2 border-[#FFC24B]/40 bg-[#FFC24B]/[0.03] py-2 pl-4 text-xs text-[#FFC24B]">
		{errors.join(" · ")} — stiamo riprovando.
	</div>
)}
			</div>

			{allMapMarkers.length > 0 ? (
				<section className="-mx-4 mb-8 sm:-mx-6"><ConcertMap markers={allMapMarkers} userLat={userLat} userLng={userLng} /></section>
			) : userLat && userLng ? (
				<section className="-mx-4 mb-8 sm:-mx-6"><ConcertMap markers={[]} userLat={userLat} userLng={userLng} /></section>
			) : null}

			{nearbyConcerts.length > 0 && (
				<section className="mb-10">
					<div className="mb-4 flex items-center gap-3">
						<div className="h-px w-6 bg-[#FFC24B]/40" />
						<span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC24B]">{nearbyConcerts.length} prossimi {userCity ? "vicino a " + userCity : "in Italia"}</span>
					</div>
					<div className="flex flex-col gap-3">
						{nearbyConcerts.map((c, idx) => {
							const isWide = idx % 3 === 0 && !!c.artistImage
							if (isWide) return (
								<div key={c.id} className="group relative overflow-hidden border border-white/10 bg-white/[0.02] transition hover:border-white/25 hover:bg-white/[0.04]">
									<div className="absolute inset-0 opacity-10"><img src={c.artistImage!} alt="" className="h-full w-full object-cover blur-sm scale-110" /></div>
									<div className="absolute inset-0 bg-gradient-to-r from-[#0E0E12] via-transparent to-[#0E0E12]" />
									<div className="relative flex items-center gap-5 p-5">
										<img src={c.artistImage!} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-white/10" />
										<div className="min-w-0 flex-1">
											<Link href={"/artist/" + (c.artistMbid || encodeURIComponent(c.artistName))} className="text-base font-bold text-white hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">{c.artistName}</Link>
											<Link href={"/concert/" + c.id} className="block mt-1">
												<p className="text-sm text-white/60">{c.venueName}{c.city ? ", " + c.city : ""}</p>
												<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
													<span className="text-white/40">{fmtDate(c.date)}</span>
													{c.distanceKm && <span className="text-white/25">{Math.round(c.distanceKm)} km</span>}
													{c.priceMin && <span className="font-semibold text-[#FFC24B]">da {c.priceMin}{c.priceCurrency === "EUR" ? "€" : " " + (c.priceCurrency ?? "")}</span>}
												</div>
											</Link>
											<div className="mt-2 flex flex-wrap items-center gap-2">
												{c.source === "ticketmaster" && <span className="rounded-full bg-[#FF2D6B]/15 px-2 py-0.5 text-[10px] font-medium text-[#FF2D6B]">Ticketmaster</span>}
												{c.ticketUrl && <a href={c.ticketUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1 rounded-full bg-[#7A5CFF]/15 px-2 py-0.5 text-[10px] font-medium text-[#7A5CFF] hover:bg-[#7A5CFF]/25 transition"><Ticket className="h-3 w-3" /> Biglietti</a>}
											</div>
										</div>
									</div>
								</div>
							)
							return (
								<div key={c.id} className="flex items-center gap-4 border-l-2 border-[#FFC24B]/20 bg-white/[0.02] py-3.5 pl-4 pr-3 transition hover:border-[#FFC24B]/50 hover:bg-white/[0.04]">
									{c.artistImage ? <img src={c.artistImage} alt="" className="h-12 w-12 shrink-0 rounded object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#17171F] text-white/25"><Calendar className="h-5 w-5" /></div>}
									<div className="min-w-0 flex-1">
										<Link href={"/artist/" + (c.artistMbid || encodeURIComponent(c.artistName))} className="text-sm font-semibold text-white hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">{c.artistName}</Link>
										<Link href={"/concert/" + c.id} className="block">
											<div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
												<span className="text-sm text-white/50">{c.venueName}{c.city ? ", " + c.city : ""}</span>
												<span className="text-xs text-white/35">{fmtDate(c.date)}</span>
												{c.distanceKm && <span className="text-xs text-white/25">{Math.round(c.distanceKm)} km</span>}
											</div>
										</Link>
										<div className="mt-1 flex flex-wrap items-center gap-2">
											{c.source === "ticketmaster" && <span className="rounded-full bg-[#FF2D6B]/15 px-2 py-0.5 text-[10px] font-medium text-[#FF2D6B]">Ticketmaster</span>}
											{c.priceMin && <span className="text-xs font-medium text-[#FFC24B]">da {c.priceMin}{c.priceCurrency === "EUR" ? "€" : " " + (c.priceCurrency ?? "")}</span>}
											{c.ticketUrl && <a href={c.ticketUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1 rounded-full bg-[#7A5CFF]/15 px-2 py-0.5 text-[10px] font-medium text-[#7A5CFF] hover:bg-[#7A5CFF]/25 transition"><Ticket className="h-3 w-3" /> Biglietti</a>}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</section>
			)}

			{pastConcerts.length > 0 && (
				<section className="mb-10">
					<details className="group">
						<summary className="mb-3 cursor-pointer flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white/70 transition"><Calendar className="h-4 w-4" /> Già passati ({pastConcerts.length})</summary>
						<div className="flex flex-wrap gap-1.5 opacity-50">
							{pastConcerts.slice(0, 8).map(c => (
								<Link key={c.id} href={"/concert/" + c.id} className="inline-flex items-center gap-1.5 border border-white/5 bg-white/[0.01] px-2.5 py-1 text-xs transition hover:border-white/15">
									<span className="font-semibold text-white/50 [font-family:var(--font-display)]">{c.artistName}</span>
									<span className="text-white/25">{c.venueName}{c.city ? ", " + c.city : ""}{c.distanceKm ? " · " + Math.round(c.distanceKm) + "km" : ""}</span>
								</Link>
							))}
						</div>
					</details>
				</section>
			)}

			{groups.size > 0 && (
				<details className="group border border-white/10 bg-white/[0.02]">
					<summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-white/40 hover:text-white/70 transition flex items-center gap-2">
						<Users className="h-4 w-4" /> {[...groups.values()].reduce((s, p) => s + p.length, 0)} appassionati nella tua zona
					</summary>
					<div className="px-5 pb-4 flex flex-col gap-4">
						{[...groups.entries()].slice(0, 3).map(([city, profiles]) => (
							<div key={city}>
								<div className="mb-2 flex items-center gap-2">
									<MapPin className="h-3.5 w-3.5 text-[#FF2D6B]" /><span className="text-sm font-semibold text-white/70">{city}</span><span className="text-xs text-white/30">{profiles.length}</span>
									{userCity && userCity.toLowerCase() === city.toLowerCase() && <span className="text-[10px] font-normal text-[#FF2D6B] uppercase tracking-wider">La tua zona</span>}
								</div>
								<div className="flex flex-wrap gap-1.5">
									{profiles.slice(0, 8).map(card => {
										const initials = card.displayName.trim().slice(0, 2).toUpperCase()
										return (
											<Link key={card.userId} href={"/u/" + card.username} className="flex items-center gap-1.5 border border-white/10 bg-white/[0.02] py-1 pl-1 pr-2.5 transition hover:border-white/25">
												{card.avatarUrl ? <img src={card.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" /> : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D6B]/60 to-[#7A5CFF]/60 text-[10px] font-bold text-white">{initials}</div>}
												<span className="text-xs text-white/60">{card.displayName}</span>
											</Link>
										)
									})}
								</div>
							</div>
						))}
					</div>
				</details>
			)}
		</main>
	)
}