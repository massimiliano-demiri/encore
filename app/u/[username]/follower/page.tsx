"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Users, ChevronRight, ArrowLeft } from "lucide-react"

type FollowerCard = {
	follower: {
		id: string
		username: string | null
		display_name: string | null
		avatar_url: string | null
		bio: string | null
	} | null
}

export default function FollowersPage() {
	const { username } = useParams<{ username: string }>()
	const supabase = createClient()
	const [followers, setFollowers] = useState<FollowerCard[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			if (!supabase) { setLoading(false); return }
			const { data: p } = await supabase
				.from("profiles")
				.select("id")
				.eq("username", username)
				.maybeSingle()
			if (!p) { setLoading(false); return }

			const { data } = await supabase
				.from("follows")
				.select("follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, bio)")
				.eq("following_id", (p as { id: string }).id)
				.order("created_at", { ascending: false })

			setFollowers((data as unknown as FollowerCard[]) ?? [])
			setLoading(false)
		}
		load()
	}, [username, supabase])

	if (loading) return <main className="mx-auto max-w-2xl p-6">Carico…</main>

	return (
		<main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
			<Link href={"/u/" + username} className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition mb-6">
				<ArrowLeft className="h-3.5 w-3.5" /> Torna al profilo
			</Link>

			<div className="mb-6 flex items-center gap-3">
				<div className="h-px w-6 bg-white/10" />
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Follower</span>
			</div>
			<h1 className="mb-6 text-2xl font-bold [font-family:var(--font-display)]">
				Chi segue @{username}
			</h1>

			{followers.length === 0 ? (
				<div className="border border-white/10 bg-white/[0.02] p-10 text-center">
					<Users className="mx-auto mb-3 h-8 w-8 text-white/20" />
					<p className="text-white/40">Nessun follower ancora.</p>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{followers.map((f) => {
						const card = f.follower
						if (!card) return null
						const initials = (card.display_name || card.username || "?").trim().slice(0, 2).toUpperCase()
						return (
							<Link
								key={card.id}
								href={"/u/" + (card.username ?? "")}
								className="group flex items-center gap-4 border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25 hover:bg-white/[0.04]"
							>
								{card.avatar_url ? (
									<img src={card.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
								) : (
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D6B]/60 to-[#7A5CFF]/60 text-sm font-bold text-white">
										{initials}
									</div>
								)}
								<div className="min-w-0 flex-1">
									<span className="font-semibold text-white group-hover:text-[#FFC24B] transition-colors [font-family:var(--font-display)]">
										{card.display_name || card.username}
									</span>
									<p className="text-xs text-white/40">@{card.username}</p>
									{card.bio && <p className="mt-1 line-clamp-1 text-sm text-white/50">{card.bio}</p>}
								</div>
								<ChevronRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-white/50 transition-colors" />
							</Link>
						)
					})}
				</div>
			)}
		</main>
	)
}