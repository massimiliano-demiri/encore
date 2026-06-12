import Link from "next/link"

export function Footer() {
	return (
		<footer className="mx-auto max-w-5xl border-t border-white/10 px-4 py-10 sm:px-6">
			<div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
				<div>
					<div className="text-sm font-bold mb-4 [font-family:var(--font-display)]">
						Enc<span className="text-[#FF2D6B]">o</span>re
					</div>
					<div className="flex flex-col gap-2">
						<Link href="/privacy" className="text-sm text-white/40 hover:text-white/70 transition">Privacy</Link>
						<Link href="/terms" className="text-sm text-white/40 hover:text-white/70 transition">Termini</Link>
					</div>
				</div>

				<div>
					<div className="text-sm font-bold mb-4 text-white/50">Scopri</div>
					<div className="flex flex-col gap-2">
						<Link href="/search" className="text-sm text-white/40 hover:text-white/70 transition">Cerca artista</Link>
						<Link href="/feed" className="text-sm text-white/40 hover:text-white/70 transition">Feed</Link>
						<Link href="/nearby" className="text-sm text-white/40 hover:text-white/70 transition">Vicino a te</Link>
					</div>
				</div>

				<div>
					<div className="text-sm font-bold mb-4 text-white/50">Il progetto</div>
					<div className="flex flex-col gap-2">
						<Link href="/privacy" className="text-sm text-white/40 hover:text-white/70 transition">Privacy</Link>
						<Link href="/terms" className="text-sm text-white/40 hover:text-white/70 transition">Termini</Link>
						<a href="mailto:m.demiri@hotmail.it" className="text-sm text-white/40 hover:text-white/70 transition">Contatti</a>
					</div>
				</div>
			</div>

			<div className="mt-10 pt-6 border-t border-white/5 flex flex-col gap-2 sm:flex-row sm:justify-between">
				<p className="text-xs text-white/25">
					&copy; {new Date().getFullYear()} Encore &mdash; Il diario dei concerti. Made in Italy.
				</p>
				<p className="text-xs text-white/20">
					Dati forniti da Setlist.fm, MusicBrainz e Ticketmaster.
				</p>
			</div>
		</footer>
	)
}