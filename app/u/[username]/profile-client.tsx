"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ConcertPoster } from "@/components/concert-poster"
import { PosterGridSkeleton } from "@/components/skeleton"
import { ProfileHeader } from "@/components/profile-header"
import { Music } from "lucide-react"

type Profile = {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
	bio: string | null
	city: string | null
}

type Log = {
	id: string
	rating: number | null
	review: string | null
	concert_id: string
	concerts: {
		date: string | null
		artists: { name: string } | null
		venues: { name: string; city: string | null } | null
	} | null
}

export function ProfileClient({ username }: { username: string }) {
	const { user } = useUser()
	const [profile, setProfile] = useState<Profile | null>(null)
	const [logs, setLogs] = useState<Log[]>([])
	const [loading, setLoading] = useState(true)
	const [commonCount, setCommonCount] = useState(0)
	const [commonLoading, setCommonLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			const supabase = createClient()
			if (!supabase) {
				setLoading(false)
				return
			}
			const { data: p } = await supabase
				.from("profiles")
				.select("id, username, display_name, avatar_url, bio, city")
				.eq("username", username)
				.maybeSingle()

			if (p) {
				const profileData = p as unknown as Profile
				setProfile(profileData)

				const { data: l } = await supabase
					.from("logs")
					.select(
						"id, rating, review, concert_id, concerts(date, artists(name), venues(name, city))",
					)
					.eq("user_id", profileData.id)
					.order("logged_at", { ascending: false })
				setLogs((l as unknown as Log[]) ?? [])

				// Concerti in comune (solo se visitatore loggato e profilo ≠ proprio)
				if (user && user.id !== profileData.id) {
					const { data: myConcerts } = await supabase
						.from("logs")
						.select("concert_id")
						.eq("user_id", user.id)
					const myIds = new Set((myConcerts ?? []).map((r: any) => r.concert_id))
					const { data: theirConcerts } = await supabase
						.from("logs")
						.select("concert_id")
						.eq("user_id", profileData.id)
					const overlap = (theirConcerts ?? []).filter((r: any) => myIds.has(r.concert_id))
					setCommonCount(overlap.length)
				}
				setCommonLoading(false)
			}
			setLoading(false)
		}
		load()
	}, [username, user])

	if (loading)
		return (
			<main className="mx-auto max-w-2xl p-6">
				<PosterGridSkeleton />
			</main>
		)

	if (!profile) return <main className="p-6">Profilo non trovato.</main>

	const isOwner = user?.id === profile.id

	return (
		<main className="pb-10">
			<ProfileHeader profile={profile} isOwner={isOwner} />

			{/* Badge concerti in comune */}
			{!isOwner && user && !commonLoading && commonCount > 0 && (
				<div className="mx-auto max-w-3xl px-6 pt-2">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF2D6B]/30 bg-[#FF2D6B]/10 px-3.5 py-1.5 text-sm text-[#FFC24B]">
						<Music className="h-3.5 w-3.5" />
						{commonCount} {commonCount === 1 ? "concerto in comune" : "concerti in comune"}
					</div>
				</div>
			)}

			<section className="mx-auto max-w-3xl px-6 pt-6">
				<h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/50">
					Concerti ({logs.length})
				</h2>
				{logs.length === 0 ? (
					<p className="text-white/60">Nessun concerto ancora.</p>
				) : (
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{logs.map((l) => (
							<ConcertPoster
								key={l.id}
								concertId={l.concert_id}
								artist={l.concerts?.artists?.name ?? "Artista"}
								rating={l.rating}
								subtitle={l.concerts?.venues?.city ?? l.concerts?.date ?? ""}
							/>
						))}
					</div>
				)}
			</section>
		</main>
	)
}