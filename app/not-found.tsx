import Link from "next/link"
import { Home, SearchX } from "lucide-react"

export default function NotFound() {
	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center">
			<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7A5CFF]/20 blur-[130px]" />
			<div className="relative w-full max-w-sm">
				<div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.03]">
					<SearchX className="h-6 w-6 text-white/60" />
				</div>
				<h1 className="text-5xl font-bold [font-family:var(--font-display)]">404</h1>
				<p className="mt-3 text-sm text-white/50">Questa pagina non esiste o è stata spostata.</p>
				<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
					<Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-[#FF2D6B] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110">
						<Home className="h-4 w-4" /> Torna alla home
					</Link>
					<Link href="/nearby" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5">
						Concerti vicino a te
					</Link>
				</div>
			</div>
		</main>
	)
}