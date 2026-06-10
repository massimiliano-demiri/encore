"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FollowButton } from "@/components/follow-button"
import { ConcertPoster } from "@/components/concert-poster"
import { PosterGridSkeleton } from "@/components/skeleton"

type Profile = {
	id: string
	username: string
	display_name: string | null
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
	const supabase = createClient()
	const [profile, setProfile] = useState<Profile | null>(null)
	const [logs, setLogs] = useState<Log[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			const { data: p } = await supabase
				.from("profiles")
				.select("id, username, display_name, bio, city")
				.eq("username", username)
				.maybeSingle()
			if (p) {
				setProfile(p as Profile)
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
		<main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
					<p className="text-sm text-muted-foreground">@{profile.username}</p>
				</div>
				<FollowButton profileId={profile.id} />
			</div>
			{profile.bio && <p className="text-sm">{profile.bio}</p>}
			<h2 className="mt-2 font-semibold">Concerti ({logs.length})</h2>
			{logs.length === 0 ? (
				<p className="text-muted-foreground">Nessun concerto ancora.</p>
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
		</main>
	)
}