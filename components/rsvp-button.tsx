"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { CalendarCheck, Calendar } from "lucide-react"

export function RsvpButton({ concertId, concertDate }: { concertId: string; concertDate: string | null }) {
	const { user } = useUser()
	const supabase = createClient()
	const [going, setGoing] = useState(false)
	const [count, setCount] = useState(0)
	const [busy, setBusy] = useState(false)
	const [ready, setReady] = useState(false)
	const isFuture = concertDate ? new Date(concertDate) > new Date() : false

	useEffect(() => {
		if (!supabase || !isFuture) { setReady(true); return }
		Promise.all([
			supabase.from("rsvps").select("*", { count: "exact", head: true }).eq("concert_id", concertId),
			user ? supabase.from("rsvps").select("user_id").eq("concert_id", concertId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
		]).then(([countRes, myRes]) => { setCount(countRes.count ?? 0); setGoing(!!myRes.data); setReady(true) })
	}, [concertId, user, isFuture, supabase])

	const toggle = async () => {
		if (!supabase || !user || busy) return
		setBusy(true)
		if (going) {
			await supabase.from("rsvps").delete().eq("user_id", user.id).eq("concert_id", concertId)
			setGoing(false); setCount((c) => Math.max(0, c - 1))
			toast.success("Rimosso dalla tua watchlist")
		} else {
			await supabase.from("rsvps").insert({ user_id: user.id, concert_id: concertId })
			setGoing(true); setCount((c) => c + 1)
			toast.success("Aggiunto alla tua watchlist")
		}
		setBusy(false)
	}

	if (!isFuture || !ready) return null

	return (
		<button onClick={toggle} disabled={busy || !user}
			className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
				going ? "border-[#FF2D6B]/40 bg-[#FF2D6B]/15 text-[#FF2D6B]" : "border-white/15 bg-white/[0.03] text-white/70 hover:border-[#FF2D6B]/40 hover:text-[#FF2D6B]"
			}`}>
			{going ? <CalendarCheck className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
			{going ? "Parteciperò" : "Parteciperò"}
			{count > 0 && <span className="ml-1 text-xs opacity-70">({count})</span>}
		</button>
	)
}