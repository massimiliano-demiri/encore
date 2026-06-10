"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { MessageCircle, Send } from "lucide-react"

type Comment = {
	id: string
	body: string
	created_at: string
	user_id: string
	profiles: { username: string | null; display_name: string | null } | null
}

export function ReviewComments({ logId }: { logId: string }) {
	const { user } = useUser()
	const supabase = createClient()
	const [open, setOpen] = useState(false)
	const [comments, setComments] = useState<Comment[]>([])
	const [count, setCount] = useState(0)
	const [body, setBody] = useState("")
	const [sending, setSending] = useState(false)

	const loadCount = async () => {
		const { count: c } = await supabase
			.from("review_comments")
			.select("*", { count: "exact", head: true })
			.eq("log_id", logId)
		setCount(c ?? 0)
	}

	const loadComments = async () => {
		const { data } = await supabase
			.from("review_comments")
			.select("id, body, created_at, user_id, profiles(username, display_name)")
			.eq("log_id", logId)
			.order("created_at", { ascending: true })
		setComments((data as unknown as Comment[]) ?? [])
	}

	useEffect(() => {
		loadCount()
	}, [logId])

	useEffect(() => {
		if (open) loadComments()
	}, [open, logId])

	const send = async () => {
		if (!user || !body.trim() || sending) return
		setSending(true)
		const { error } = await supabase
			.from("review_comments")
			.insert({ log_id: logId, user_id: user.id, body: body.trim() })
		setSending(false)
		if (!error) {
			setBody("")
			setCount((c) => c + 1)
			loadComments()
		}
	}

	return (
		<div>
			<button
				onClick={() => setOpen((v) => !v)}
				className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
			>
				<MessageCircle className="h-4 w-4" />
				{count > 0 ? count : "Commenta"}
			</button>

			{open && (
				<div className="mt-3 flex flex-col gap-3">
					{comments.map((c) => (
						<div key={c.id} className="rounded-lg bg-white/[0.03] p-3">
							<div className="text-xs text-white/40">
								{c.profiles?.username ? (
									<Link href={"/u/" + c.profiles.username} className="font-medium text-white/70 hover:underline">
										{c.profiles.display_name || c.profiles.username}
									</Link>
								) : (
									"Qualcuno"
								)}
							</div>
							<p className="mt-1 text-sm text-white/80">{c.body}</p>
						</div>
					))}

					{user ? (
						<div className="flex items-center gap-2">
							<input
								value={body}
								onChange={(e) => setBody(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && send()}
								placeholder="Scrivi un commento…"
								className="flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/30"
							/>
							<button
								onClick={send}
								disabled={sending || !body.trim()}
								className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FF2D6B] text-white disabled:opacity-40"
								aria-label="Invia"
							>
								<Send className="h-4 w-4" />
							</button>
						</div>
					) : (
						<p className="text-sm text-white/40">
							<Link href="/login" className="underline">Accedi</Link> per commentare.
						</p>
					)}
				</div>
			)}
		</div>
	)
}