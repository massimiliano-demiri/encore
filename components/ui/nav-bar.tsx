import Link from "next/link"

export function NavBar() {
	return (
		<header className="sticky top-0 z-50 border-b border-white/10 bg-[#0E0E12] text-white">
			<nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
				<Link href="/" className="text-lg font-bold tracking-tight">
					Enc<span className="text-[#FF2D6B]">o</span>re
				</Link>
				<div className="flex items-center gap-4 text-sm">
					<Link href="/search" className="text-white/70 hover:text-white">
						Cerca
					</Link>
                    <Link href="/feed" className="text-white/70 hover:text-white">
	Feed
</Link>
					<Link href="/me" className="text-white/70 hover:text-white">
						Profilo
					</Link>
					<Link
						href="/login"
						className="rounded-full bg-[#FF2D6B] px-3 py-1 font-medium text-white hover:bg-[#FF2D6B]/90"
					>
						Accedi
					</Link>
				</div>
			</nav>
		</header>
	)
}