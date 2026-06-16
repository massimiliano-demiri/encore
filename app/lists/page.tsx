"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { Plus, ListMusic, Lock, Globe } from "lucide-react"

type ListRow = { id: string; title: string | null; description: string | null; is_public: boolean }

export default function ListsPage() {
	const { user, loading } = useUser()
	const supabase = createClient()
	const [lists, setLists] = useState<ListRow[]>([])
	const [title, setTitle] = useState("")
	const [isPublic, setIsPublic] = useState(true)
	const [saving, setSaving] = useState(false)
	const [loadingLists, setLoadingLists] = useState(true)

	const load = async (uid: string) => {
		if (!supabase) return
		const { data } = await supabase.from("lists").select("id, title, description, is_public").eq("user_id", uid).order("created_at", { ascending: false })
		setLists((data as unknown as ListRow[]) ?? [])
		setLoadingLists(false)
	}

	useEffect(() => { if (user) load(user.id) }, [user])

	const create = async () => {
		if (!supabase || !user || !title.trim()) return
		setSaving(true)
		const { error } = await supabase.from("lists").insert({ user_id: user.id, title: title.trim(), is_public: isPublic })
		setSaving(false)
		if (!error) { setTitle(""); load(user.id) }
	}

	if (loading) return (
		<main className="mx-auto max-w-2xl p-6">
			{[...Array(3)].map((_, i) => (<div key={i} className="mb-3 h-16 animate-pulse border-l-2 border-white/5 bg-white/[0.02]" />))}
		</main>
	)

	if (!user) return (
		<main className="mx-auto max-w-2xl p-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="h-px w-6 bg-white/10" />
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Liste</span>
			</div>
			<div className="border-l-2 border-white/5 py-6 pl-5 text-white/40">
				<ListMusic className="mb-2 h-6 w-6 text-white/15" />
				<p><Link href="/login" className="text-[#FF2D6B] hover:underline">Accedi</Link> per creare le tue liste.</p>
			</div>
		</main>
	)

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
			<div>
				<div className="flex items-center gap-3 mb-4">
					<div className="h-px w-6 bg-white/10" />
					<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Le tue liste</span>
				</div>
				<p className="text-sm text-white/50">Raccogli i concerti come vuoi tu.</p>
			</div>

			<div className="flex flex-col gap-3 border-l-2 border-white/10 bg-white/[0.02] py-3 pl-4">
				<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome della lista (es. Concerti della vita)"
					className="border border-white/10 bg-transparent px-3 py-2 text-sm outline-none transition placeholder:text-white/30 focus:border-white/30" />
				<div className="flex items-center justify-between">
					<button type="button" onClick={() => setIsPublic((v) => !v)} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
						{isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{isPublic ? "Pubblica" : "Privata"}
					</button>
					<button onClick={create} disabled={saving || !title.trim()} className="bg-[#FF2D6B] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40">
						<Plus className="inline h-4 w-4 mr-1" />Crea
					</button>
				</div>
			</div>

			{loadingLists ? (
				<div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => (<div key={i} className="h-16 animate-pulse border-l-2 border-white/5 bg-white/[0.02]" />))}</div>
			) : lists.length === 0 ? (
				<div className="border-l-2 border-white/5 py-6 pl-5 text-white/40">
					<ListMusic className="mb-2 h-6 w-6 text-white/15" />
					<p>Non hai ancora liste. Creane una qui sopra.</p>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{lists.map((l) => (
						<Link key={l.id} href={"/list/" + l.id}
							className="flex items-center justify-between border-l-2 border-white/10 bg-white/[0.02] py-3 pl-4 pr-4 transition hover:border-[#FF2D6B]/30 hover:bg-white/[0.04]">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center bg-[#FF2D6B]/15"><ListMusic className="h-5 w-5 text-[#FF2D6B]" /></div>
								<div>
									<div className="font-medium">{l.title || "Senza titolo"}</div>
									{l.description && <div className="text-sm text-white/50">{l.description}</div>}
								</div>
							</div>
							{l.is_public ? <Globe className="h-4 w-4 text-white/40" /> : <Lock className="h-4 w-4 text-white/40" />}
						</Link>
					))}
				</div>
			)}
		</main>
	)
}