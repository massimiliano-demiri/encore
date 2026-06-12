"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { useGeolocation } from "@/lib/use-geolocation"
import { MapPin, Users, ChevronRight, Navigation, Calendar, Star } from "lucide-react"

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

type TodayConcert = {
	id: string
	date: string | null
	rating: number | null
	artists: { name: string; mbid: string | null } | null
	venues: { name: string; city: string | null } | null
}

const fmtDate = (d: string | null) =>
	d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""

export default function NearbyPage() {
	const { user } = useUser()
	const supabase = createClient()
	const geo = useGeolocation()
	const [groups, setGroups] = useState<Map<string, ProfileCard[]>>(new Map())
	const [todayConcerts, setTodayConcerts] = useState<TodayConcert[]>([])
	const [loading, setLoading] = useState(true)

	// Città effettiva: GPS > profilo utente > prima venue
	const effectiveCity =
		geo.city ||
		(groups.size > 0
			? [...groups.keys()][0]
			: null)

	useEffect(() => {
		const load = async () => {
			if (!supabase) { setLoading(false); return }

			const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

			const [
				{ data: allLogs },
				{ data: todayData },
			] = await Promise.all([
				supabase
					.from("logs")
					.select("user_id, profiles(username, display_name, avatar_url, bio, city), concerts(venues(city))")
					.not("profiles", "is", null)
					.order("logged_at", { ascending: false }),
				supabase
					.from("concerts")
					.select("id, date, artists(name, mbid), venues(name, city)")
					.eq("date", today)
					.order("date", { ascending: true })
					.limit(20),
			])

			const rows = (allLogs as unknown as Array<{
				user_id: string
				profiles: {
					username: string | null
					display_name: string | null
					avatar_url: string | null
					bio: string | null
					city: string | null
				} | null
				concerts: { venues: { city: string | null } | null } | null
			}>) ?? []

			setTodayConcerts((todayData as unknown as TodayConcert[]) ?? [])

			// Raggruppa per utente
			const byUser = new Map<string, ProfileCard>()
			for (const row of rows) {
				const p = row.profiles
				if (!p?.username) continue

				const existing = byUser.get(row.user_id)
				const venueCity = row.concerts?.venues?.city ?? null

				if (existing) {
					existing.concertCount++
					if (venueCity && !existing.venueCities.includes(venueCity)) {
						existing.venueCities.push(venueCity)
					}
				} else {
					byUser.set(row.user_id, {
						userId: row.user_id,
						username: p.username,
						displayName: p.display_name || p.username,
						avatarUrl: p.avatar_url,
						bio: p.bio,
						profileCity: p.city,
						venueCities: venueCity ? [venueCity] : [],
						concertCount: 1,
					})
				}
			}

			// Raggruppa per città
			const grouped = new Map<string, ProfileCard[]>()
			for (const card of byUser.values()) {
				const city = card.venueCities[0] || card.profileCity || "Ovunque"
				if (!grouped.has(city)) grouped.set(city, [])
				grouped.get(city)!.push(card)
			}

			// Ordina: usa la città GPS se disponibile
			const sorted = new Map<string, ProfileCard[]>()
			const gpsCity = geo.city
			if (gpsCity) {
				// Cerca match case-insensitive
				const match = [...grouped.keys()].find(
					(k) => k.toLowerCase() === gpsCity.toLowerCase(),
				)
				if (match) {
					sorted.set(match, grouped.get(match)!)
					grouped.delete(match)
				}
			}
			for (const [city, cards] of [...grouped.entries()].sort((a, b) =>
				a[0].localeCompare(b[0]),
			)) {
				sorted.set(city, cards)
			}

			setGroups(sorted)
			setLoading(false)
		}
		load()
	}, [supabase, geo.city])

	if (loading || geo.loading) return <main className="mx-auto max-w-2xl p-6">Carico…</main>

	const cities = [...groups.entries()]

	const userCity = effectiveCity
	const todaysInMyCity = userCity
		? todayConcerts.filter(
				(c) =>
					c.venues?.city &&
					c.venues.city.toLowerCase() === userCity.toLowerCase(),
			)
		: []

	return (
		<main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
			{/* Header con GPS status */}
			<div className="mb-6 flex items-center gap-3">
				<div className="h-px w-6 bg-white/10" />
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
					Vicino a te
				</span>
			</div>

			<div className="mb-8">
				<h1 className="text-3xl font-bold [font-family:var(--font-display)]">
					Chi va ai concerti nella tua zona
				</h1>
				{geo.city ? (
					<p className="mt-1 flex items-center gap-1.5 text-sm text-[#FF2D6B]">
						<Navigation className="h-3.5 w-3.5" />
						Rilevata: {geo.city}
					</p>
				) : (
					<p className="mt-1 text-sm text-white/40">
						{geo.error || "Concedi la geolocalizzazione o logga un concerto per attivare la tua zona."}
					</p>
				)}
			</div>

			{/* ─── OGGI NELLA TUA ZONA ─── */}
			{userCity && todaysInMyCity.length > 0 && (
				<section className="mb-10">
					<div className="mb-4 flex items-center gap-2">
						<Calendar className="h-4 w-4 text-[#FFC24B]" />
						<h2 className="text-lg font-bold text-white [font-family:var(--font-display)]">
							Oggi a {userCity}
						</h2>
					</div>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{todaysInMyCity.map((c) => (
							<Link
								key={c.id}
								href={"/concert/" + c.id}
								className="group flex items-center gap-4 border border-[#FFC24B]/20 bg-[#FFC24B]/[0.03] p-4 transition hover:border-[#FFC24B]/40 hover:bg-[#FFC24B]/[0.06]"
							>
								<div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#17171F] text-[#FFC24B]">
									<Calendar className="h-5 w-5" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">
										{c.artists?.name ?? "Artista"}
									</p>
									<p className="text-sm text-white/50">
										{c.venues?.name}
										{c.venues?.city ? ", " + c.venues.city : ""}
									</p>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* Chi c'è */}
			{cities.length === 0 ? (
				<div className="border border-white/10 bg-white/[0.02] p-10 text-center">
					<Users className="mx-auto mb-3 h-8 w-8 text-white/20" />
					<p className="text-white/40">Nessun profilo ancora. Logga un concerto per comparire qui.</p>
				</div>
			) : (
				<div className="flex flex-col gap-10">
					{cities.map(([city, profiles]) => (
						<section key={city}>
							<div className="mb-3 flex items-center gap-2">
								<MapPin className="h-4 w-4 text-[#FF2D6B]" />
								<h2 className="text-lg font-bold text-white [font-family:var(--font-display)]">
									{city}
									{geo.city && geo.city.toLowerCase() === city.toLowerCase() && (
										<span className="ml-2 text-xs font-normal text-[#FF2D6B] uppercase tracking-wider">
											La tua zona
										</span>
									)}
								</h2>
								<span className="text-xs text-white/30">{profiles.length}</span>
							</div>

							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								{profiles.map((card) => {
									const initials = card.displayName.trim().slice(0, 2).toUpperCase()
									return (
										<Link
											key={card.userId}
											href={"/u/" + card.username}
											className="group flex items-center gap-4 border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25 hover:bg-white/[0.04]"
										>
											{card.avatarUrl ? (
												<img
													src={card.avatarUrl}
													alt={card.displayName}
													className="h-12 w-12 shrink-0 rounded-full object-cover"
												/>
											) : (
												<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D6B]/60 to-[#7A5CFF]/60 text-sm font-bold text-white">
													{initials}
												</div>
											)}

											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<span className="font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">
														{card.displayName}
													</span>
												</div>
												<p className="text-xs text-white/40">@{card.username}</p>
												{card.bio && (
													<p className="mt-1 line-clamp-1 text-sm text-white/50">{card.bio}</p>
												)}
												<div className="mt-1.5 flex items-center gap-3 text-xs text-white/30">
													<span>{card.concertCount} {card.concertCount === 1 ? "concerto" : "concerti"}</span>
													{card.venueCities.length > 1 && (
														<span>+{card.venueCities.length - 1} città</span>
													)}
												</div>
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