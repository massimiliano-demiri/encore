"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { ListPlus, Check, Plus } from "lucide-react"

type ListRow = { id: string; title: string | null }

export function AddToList({ concertId }: { concertId: string }) {
	const { user } = useUser()
	const supabase = createClient()
	const [open, setOpen] = useState(false)
	const [lists, setLists] = useState<ListRow[]>([])
	const [member, setMember] = useState<Record<string, boolean>>({})
	const [loading, setLoading] = useState(false)
	const [newTitle, setNewTitle] = useState("")

	const refresh = async () => {
		if (!user || !supabase) return
		setLoading(true)
		const { data: ls } = await supabase
			.from("lists")
			.select("id, title")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })
		setLists((ls as unknown as ListRow[]) ?? [])
		const { data: items } = await supabase
			.from("list_items")
			.select("list_id")
			.eq("concert_id", concertId)
		const map: Record<string, boolean> = {}
		for (const it of (items as unknown as { list_id: string }[]) ?? []) map[it.list_id] = true
		setMember(map)
		setLoading(false)
	}

	useEffect(() => {
		if (open) refresh()
	}, [open])

	const toggle = async (listId: string) => {
		if (!supabase) return
		if (member[listId]) {
			await supabase.from("list_items").delete().eq("list_id", listId).eq("concert_id", concertId)
			setMember((m) => ({ ...m, [listId]: false }))
		} else {
			await supabase.from("list_items").insert({ list_id: listId, concert_id: concertId })
			setMember((m) => ({ ...m, [listId]: true }))
		}
	}

	const createAndAdd = async () => {
		if (!supabase || !user || !newTitle.trim()) return
		const { data, error } = await supabase
			.from("lists")
			.insert({ user_id: user.id, title: newTitle.trim(), is_public: true })
			.select("id, title")
			.single()
		if (!error && data) {
			const row = data as unknown as ListRow
			await supabase.from("list_items").insert({ list_id: row.id, concert_id: concertId })
			setLists((prev) => [row, ...prev])
			setMember((m) => ({ ...m, [row.id]: true }))
			setNewTitle("")
		}
	}

	if (!user) return null

	return (
		<div className="relative">
			<button
				onClick={() => setOpen((v) => !v)}
				className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
			>
				<ListPlus className="h-4 w-4" /> Aggiungi a una lista
			</button>
			{open && (
				<div className="absolute z-20 mt-2 w-72 rounded-2xl border border-white/10 bg-[#17171F] p-3 shadow-xl">
					{loading ? (
						<p className="px-1 py-2 text-sm text-white/50">Carico…</p>
					) : (
						<>
							{lists.length === 0 ? (
								<p className="px-1 py-2 text-sm text-white/50">Nessuna lista ancora. Creane una qui sotto.</p>
							) : (
								<ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
									{lists.map((l) => (
										<li key={l.id}>
											<button
												onClick={() => toggle(l.id)}
												className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5"
											>
												<span className="truncate">{l.title || "Senza titolo"}</span>
												{member[l.id] && <Check className="h-4 w-4 text-[#FF2D6B]" />}
											</button>
										</li>
									))}
								</ul>
							)}
							<div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
								<input
									value={newTitle}
									onChange={(e) => setNewTitle(e.target.value)}
									placeholder="Nuova lista…"
									className="flex-1 rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-white/30 focus:border-white/30"
								/>
								<button
									onClick={createAndAdd}
									disabled={!newTitle.trim()}
									className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FF2D6B] text-white disabled:opacity-40"
									aria-label="Crea e aggiungi"
								>
									<Plus className="h-4 w-4" />
								</button>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	)
}