"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Pencil, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { FollowButton } from "@/components/follow-button"

type Profile = {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
	bio: string | null
	city: string | null
}

export function ProfileHeader({ profile, isOwner }: { profile: Profile; isOwner: boolean }) {
	const supabase = createClient()
	const [stats, setStats] = useState({ concerts: 0, followers: 0, following: 0 })

	useEffect(() => {
		const load = async () => {
			if (!supabase) return
			const [c, f1, f2] = await Promise.all([
				supabase.from("logs").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
				supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
				supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
			])
			setStats({ concerts: c.count ?? 0, followers: f1.count ?? 0, following: f2.count ?? 0 })
		}
		load()
	}, [profile.id, supabase])

	const name = profile.display_name || profile.username || "Utente"
	const initials = name.trim().slice(0, 2).toUpperCase()

	return (
		<header className="mx-auto max-w-3xl px-6 pt-10">
			<div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:gap-6 sm:text-left">
				{profile.avatar_url ? (
					<img src={profile.avatar_url} alt={name} className="h-24 w-24 rounded-full object-cover ring-2 ring-white/10" />
				) : (
					<div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D6B] to-[#7A5CFF] text-2xl font-bold [font-family:var(--font-display)]">
						{initials}
					</div>
				)}
				<div className="flex-1">
					<h1 className="text-2xl font-bold [font-family:var(--font-display)]">{name}</h1>
					{profile.username && <p className="text-sm text-white/50">@{profile.username}</p>}
					{profile.bio && <p className="mt-2 text-sm text-white/70">{profile.bio}</p>}
					{profile.city && (
						<p className="mt-1 flex items-center justify-center gap-1 text-sm text-white/50 sm:justify-start">
							<MapPin className="h-3.5 w-3.5" /> {profile.city}
						</p>
					)}
				</div>
				<div className="shrink-0">
					{isOwner ? (
						<Link href="/settings" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5">
							<Pencil className="h-3.5 w-3.5" /> Modifica profilo
						</Link>
					) : (
						<FollowButton profileId={profile.id} />
					)}
				</div>
			</div>
			<div className="mt-6 flex justify-center gap-8 border-y border-white/10 py-4 sm:justify-start">
				<Stat value={stats.concerts} label="Concerti" />
				<Stat value={stats.followers} label="Follower" />
				<Stat value={stats.following} label="Seguiti" />
			</div>
		</header>
	)
}

function Stat({ value, label }: { value: number; label: string }) {
	return (
		<div className="text-center">
			<div className="text-xl font-bold">{value}</div>
			<div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
		</div>
	)
}