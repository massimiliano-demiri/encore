"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { Button } from "@/components/ui/button"

export function FollowButton({ profileId }: { profileId: string }) {
	const { user } = useUser()
	const supabase = createClient()
	const [following, setFollowing] = useState(false)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		if (!user || !supabase) {
			setReady(true)
			return
		}
		supabase
			.from("follows")
			.select("follower_id")
			.eq("follower_id", user.id)
			.eq("following_id", profileId)
			.maybeSingle()
			.then(({ data }) => {
				setFollowing(!!data)
				setReady(true)
			})
	}, [user, profileId, supabase])

	if (!user || user.id === profileId || !ready) return null

	const toggle = async () => {
		if (!supabase) return
		if (following) {
			await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileId)
			setFollowing(false)
		} else {
			await supabase.from("follows").insert({ follower_id: user.id, following_id: profileId })
			setFollowing(true)
		}
	}

	return (
		<Button onClick={toggle} size="sm" variant={following ? "outline" : "default"}>
			{following ? "Segui già" : "Segui"}
		</Button>
	)
}