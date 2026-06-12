"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react"

type Notification = {
	id: string
	type: "follow" | "like" | "comment"
	actor: { username: string | null; display_name: string | null; avatar_url: string | null } | null
	log_id: string | null
	read: boolean
	created_at: string
}

const fmtTime = (t: string) => {
	const d = new Date(t)
	const now = new Date()
	const diff = now.getTime() - d.getTime()
	const mins = Math.floor(diff / 60000)
	if (mins < 1) return "ora"
	if (mins < 60) return mins + "m fa"
	const hours = Math.floor(mins / 60)
	if (hours < 24) return hours + "h fa"
	const days = Math.floor(hours / 24)
	if (days < 7) return days + "g fa"
	return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" })
}

export default function NotificationsPage() {
	const { user } = useUser()
	const supabase = createClient()
	const [notifs, setNotifs] = useState<Notification[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			if (!supabase || !user) { setLoading(false); return }
			const { data } = await supabase
				.from("notifications")
				.select("id, type, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url), log_id, read, created_at")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(50)
			setNotifs((data as unknown as Notification[]) ?? [])

			await supabase
				.from("notifications")
				.update({ read: true })
				.eq("user_id", user.id)
				.eq("read", false)
			setLoading(false)
		}
		load()
	}, [user, supabase])

	if (loading) return <main className="mx-auto max-w-2xl p-6">Carico…</main>
	if (!user) return <main className="mx-auto max-w-2xl p-6">Accedi per vedere le notifiche.</main>

	const iconFor = (type: string) => {
		switch (type) {
			case "follow": return <UserPlus className="h-3.5 w-3.5 text-[#7A5CFF]" />
			case "like": return <Heart className="h-3.5 w-3.5 text-[#FF2D6B] fill-current" />
			case "comment": return <MessageCircle className="h-3.5 w-3.5 text-[#FFC24B]" />
			default: return <Bell className="h-3.5 w-3.5" />
		}
	}

	const textFor = (n: Notification) => {
		const name = n.actor?.display_name || n.actor?.username || "Qualcuno"
		switch (n.type) {
			case "follow": return <><span className="font-semibold text-white">{name}</span> ha iniziato a seguirti</>
			case "like": return <><span className="font-semibold text-white">{name}</span> ha messo like alla tua recensione</>
			case "comment": return <><span className="font-semibold text-white">{name}</span> ha commentato la tua recensione</>
		}
	}

	return (
		<main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
			<div className="mb-6 flex items-center gap-3">
				<div className="h-px w-6 bg-white/10" />
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Notifiche</span>
			</div>
			<h1 className="mb-6 text-2xl font-bold [font-family:var(--font-display)]">Cosa è successo</h1>

			{notifs.length === 0 ? (
				<div className="border border-white/10 bg-white/[0.02] p-10 text-center">
					<Bell className="mx-auto mb-3 h-8 w-8 text-white/20" />
					<p className="text-white/40">Nessuna notifica.</p>
				</div>
			) : (
				<div className="flex flex-col gap-1">
					{notifs.map((n) => {
						const actor = n.actor
						const initials = (actor?.display_name || actor?.username || "?").trim().slice(0, 2).toUpperCase()
						const href =
							n.type === "follow" && actor?.username
								? "/u/" + actor.username
								: n.type === "like" || n.type === "comment"
									? "/concert/" + n.log_id?.split("-")[0]
									: "#"

						return (
							<div
								key={n.id}
								className={`flex items-center gap-4 border-l-2 p-4 transition hover:bg-white/[0.04] ${
									n.read ? "border-transparent" : "border-[#FF2D6B]/60 bg-white/[0.03]"
								}`}
							>
								<div className="shrink-0 relative">
									{actor?.avatar_url ? (
										<img src={actor.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
									) : (
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D6B]/60 to-[#7A5CFF]/60 text-xs font-bold text-white">
											{initials}
										</div>
									)}
									<div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#17171F] border border-white/10">
										{iconFor(n.type)}
									</div>
								</div>

								<div className="min-w-0 flex-1">
									<Link href={href} className="text-sm leading-relaxed block">
										{textFor(n)}
									</Link>
									<span className="text-xs text-white/30">{fmtTime(n.created_at)}</span>
								</div>

								{!n.read && <div className="h-2 w-2 shrink-0 rounded-full bg-[#FF2D6B]" />}
							</div>
						)
					})}
				</div>
			)}
		</main>
	)
}