"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/use-user"
import { Plus, ListMusic, Lock, Globe } from "lucide-react"

type ListRow = {
	id: string
	title: string | null
	description: string | null
	is_public: boolean
}

export default function ListsPage() {
	const { user, loading } = useUser()
	const supabase = createClient()
	const [lists, setLists] = useState<ListRow[]>([])
	const [title, setTitle] = useState("")
	const [isPublic, setIsPublic] = useState(true)
	const [saving, setSaving] = useState(false)
	const [loadingLists, setLoadingLists] = useState(true)

	const load = async (uid: string) => {
		const { data } = await supabase
			.from("lists")
			.select("id, title, description, is_public")
			.eq("user_id", uid)
			.order("created_at", { ascending: false })
		setLists((data as unknown as ListRow[]) ?? [])
		setLoadingLists(false)
	}

	useEffect(() => {
		if (user) load(user.id)
	}, [user])

	const create = async () => {
		if (!user || !title.trim()) return
		setSaving(true)
		const { error } = await supabase
			.from("lists")
			.insert({ user_id: user.id, title: title.trim(), is_public: isPublic })
		setSaving(false)
		if (!error) {
			setTitle("")
			load(user.id)
		}
	}

	if (loading) return <main className="p-6">Carico…</main>
	if (!user)
		return (
			<main className="p-6">
				<Link href="/login" className="underline">Accedi</Link> per creare le tue liste.
			</main>
		)

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
			<div>
				<h1 className="text-2xl font-bold [font-family:var(--font-display)]">Le tue liste</h1>
				<p className="mt-1 text-sm text-white/50">Raccogli i concerti come vuoi tu.</p>
			</div>

			<div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
				<input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Nome della lista (es. Concerti della vita)"
					className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/30"
				/>
				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={() => setIsPublic((v) => !v)}
						className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
					>
						{isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
						{isPublic ? "Pubblica" : "Privata"}
					</button>
					<button
						onClick={create}
						disabled={saving || !title.trim()}
						className="inline-flex items-center gap-1.5 rounded-full bg-[#FF2D6B] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
					>
						<Plus className="h-4 w-4" /> Crea
					</button>
				</div>
			</div>

			{loadingLists ? (
				<p className="text-white/50">Carico…</p>
			) : lists.length === 0 ? (
				<p className="text-white/50">Non hai ancora liste. Creane una qui sopra.</p>
			) : (
				<ul className="flex flex-col gap-3">
					{lists.map((l) => (
						<li key={l.id}>
							<Link
								href={"/list/" + l.id}
								className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/25"
							>
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF2D6B]/15">
										<ListMusic className="h-5 w-5 text-[#FF2D6B]" />
									</div>
									<div>
										<div className="font-medium">{l.title || "Senza titolo"}</div>
										{l.description && <div className="text-sm text-white/50">{l.description}</div>}
									</div>
								</div>
								{l.is_public ? (
									<Globe className="h-4 w-4 text-white/40" />
								) : (
									<Lock className="h-4 w-4 text-white/40" />
								)}
							</Link>
						</li>
					))}
				</ul>
			)}
		</main>
	)
}