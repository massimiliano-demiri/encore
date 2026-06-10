"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { Heart } from "lucide-react"

export function ReviewLikes({ logId }: { logId: string }) {
	const { user } = useUser()
	const supabase = createClient()
	const [count, setCount] = useState(0)
	const [liked, setLiked] = useState(false)
	const [busy, setBusy] = useState(false)

	useEffect(() => {
		const load = async () => {
			const { count: c } = await supabase
				.from("review_likes")
				.select("*", { count: "exact", head: true })
				.eq("log_id", logId)
			setCount(c ?? 0)
			if (user) {
				const { data } = await supabase
					.from("review_likes")
					.select("user_id")
					.eq("log_id", logId)
					.eq("user_id", user.id)
					.maybeSingle()
				setLiked(!!data)
			}
		}
		load()
	}, [logId, user])

	const toggle = async () => {
		if (!user || busy) return
		setBusy(true)
		if (liked) {
			await supabase.from("review_likes").delete().eq("log_id", logId).eq("user_id", user.id)
			setLiked(false)
			setCount((c) => Math.max(0, c - 1))
		} else {
			await supabase.from("review_likes").insert({ log_id: logId, user_id: user.id })
			setLiked(true)
			setCount((c) => c + 1)
		}
		setBusy(false)
	}

	return (
		<button
			onClick={toggle}
			disabled={!user || busy}
			className={
				"inline-flex items-center gap-1.5 text-sm transition " +
				(liked ? "text-[#FF2D6B]" : "text-white/50 hover:text-white") +
				(!user ? " cursor-default" : "")
			}
			aria-label="Mi piace"
		>
			<Heart className={"h-4 w-4 " + (liked ? "fill-current" : "")} />
			{count > 0 && count}
		</button>
	)
}