"use client"

import Link from "next/link"
import { Home, Search, Newspaper, User } from "lucide-react"

const links = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/search", label: "Cerca", icon: Search },
	{ href: "/feed", label: "Feed", icon: Newspaper },
	{ href: "/me", label: "Profilo", icon: User },
]

export function NavBar() {
	return (
		<>
			<header className="sticky top-0 z-40 border-b border-white/10 bg-[#0E0E12]/90 backdrop-blur">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
					<Link href="/" className="text-lg font-bold [font-family:var(--font-display)]">
						Enc<span className="text-[#FF2D6B]">o</span>re
					</Link>
					<nav className="hidden items-center gap-5 text-sm sm:flex">
						<Link href="/search" className="hover:text-[#FF2D6B]">Cerca</Link>
						<Link href="/feed" className="hover:text-[#FF2D6B]">Feed</Link>
						<Link href="/me" className="hover:text-[#FF2D6B]">Profilo</Link>
						<Link href="/login" className="rounded-full bg-[#FF2D6B] px-3 py-1 font-medium text-white">Accedi</Link>
					</nav>
				</div>
			</header>

			<nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-[#0E0E12]/95 backdrop-blur sm:hidden">
				{links.map(({ href, label, icon: Icon }) => (
					<Link
						key={href}
						href={href}
						className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-white/70 hover:text-[#FF2D6B]"
					>
						<Icon className="h-5 w-5" />
						{label}
					</Link>
				))}
			</nav>
		</>
	)
}