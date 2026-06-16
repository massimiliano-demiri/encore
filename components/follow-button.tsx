"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"

export function FollowButton({ profileId }: { profileId: string }) {
	const { user } = useUser()
	const supabase = createClient()
	const [following, setFollowing] = useState(false)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		if (!user || !supabase) { setReady(true); return }
		supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", profileId).maybeSingle()
			.then(({ data }) => { setFollowing(!!data); setReady(true) })
	}, [user, profileId, supabase])

	if (!user || user.id === profileId || !ready) return null

	const toggle = async () => {
		if (!supabase) return
		if (following) {
			await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileId)
			setFollowing(false)
			toast.success("Non segui più")
		} else {
			await supabase.from("follows").insert({ follower_id: user.id, following_id: profileId })
			setFollowing(true)
			toast.success("Ora segui questo profilo")
		}
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