"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"

export function FollowButton({ profileId, username, autoFollow = false }: { profileId: string; username?: string; autoFollow?: boolean }) {
	const { user } = useUser()
	const supabase = createClient()
	const [following, setFollowing] = useState(false)
	const [ready, setReady] = useState(false)
	const autoDone = useRef(false)

	useEffect(() => {
		if (!user || !supabase) { setReady(true); return }
		supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", profileId).maybeSingle()
			.then(({ data }) => { setFollowing(!!data); setReady(true) })
	}, [user, profileId, supabase])

	const follow = async () => {
		if (!supabase || !user) return
		await supabase.from("follows").insert({ follower_id: user.id, following_id: profileId })
		setFollowing(true)
	}
	const unfollow = async () => {
		if (!supabase || !user) return
		await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileId)
		setFollowing(false)
	}

	// Auto-follow quando si arriva da un link "fatti seguire" (?follow=1)
	useEffect(() => {
		if (!autoFollow || autoDone.current) return
		if (!ready || !user || following || user.id === profileId) return
		autoDone.current = true
		follow().then(() => toast.success("Ora segui questo profilo"))
	}, [autoFollow, ready, user, following, profileId])

	// Non loggato: invita a registrarsi mantenendo il ritorno al profilo
	if (!user) {
		const next = username ? "/u/" + username + "?follow=1" : ""
		const href = next ? "/signup?next=" + encodeURIComponent(next) : "/signup"
		return (
			<Link href={href} className="inline-flex items-center gap-1.5 bg-[#FF2D6B] border border-[#FF2D6B] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110">
				Segui
			</Link>
		)
	}

	if (user.id === profileId || !ready) return null

	const toggle = async () => {
		if (following) { await unfollow(); toast.success("Non segui più") }
		else { await follow(); toast.success("Ora segui questo profilo") }
	}

	return (
		<button onClick={toggle}
			className={`inline-flex items-center gap-1.5 border px-4 py-2 text-sm font-medium transition ${
				following ? "border-white/15 text-white/50 hover:text-white/70" : "bg-[#FF2D6B] border-[#FF2D6B] text-white hover:brightness-110"
			}`}>
			{following ? "Segui già" : "Segui"}
		</button>
	)
}