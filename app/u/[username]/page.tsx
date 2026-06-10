"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ConcertPoster } from "@/components/concert-poster"
import { PosterGridSkeleton } from "@/components/skeleton"
import { ProfileHeader } from "@/components/profile-header"

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

export default function PublicProfile() {
	const { username } = useParams<{ username: string }>()
	const { user } = useUser()
	const supabase = createClient()
	const [profile, setProfile] = useState<Profile | null>(null)
	const [logs, setLogs] = useState<Log[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			const { data: p } = await supabase
				.from("profiles")
				.select("id, username, display_name, avatar_url, bio, city")
				.eq("username", username)
				.maybeSingle()
			if (p) {
				setProfile(p as unknown as Profile)
				const { data: l } = await supabase
					.from("logs")
					.select("id, rating, review, concert_id, concerts(date, artists(name), venues(name, city))")
					.eq("user_id", p.id)
					.order("logged_at", { ascending: false })
				setLogs((l as unknown as Log[]) ?? [])
			}
			setLoading(false)
		}
		load()
	}, [username])

	if (loading)
		return (
			<main className="mx-auto max-w-2xl p-6">
				<PosterGridSkeleton />
			</main>
		)
	if (!profile) return <main className="p-6">Profilo non trovato.</main>

	return (
		<main className="pb-10">
			<ProfileHeader profile={profile} isOwner={user?.id === profile.id} />

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