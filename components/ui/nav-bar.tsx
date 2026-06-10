"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Newspaper, User, ListMusic } from "lucide-react"

const links = [
	{ href: "/", label: "Home", Icon: Home },
	{ href: "/search", label: "Cerca", Icon: Search },
	{ href: "/feed", label: "Feed", Icon: Newspaper },
		{ href: "/lists", label: "Liste", Icon: ListMusic },
	{ href: "/me", label: "Profilo", Icon: User },
]

export function NavBar() {
	const pathname = usePathname()
	const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

	return (
		<>
			<header className="sticky top-0 z-30 border-b border-white/10 bg-[#0E0E12]/80 backdrop-blur">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
					<Link href="/" className="text-xl font-bold [font-family:var(--font-display)]">
						Enc<span className="text-[#FF2D6B]">o</span>re
					</Link>
					<nav className="hidden gap-1 sm:flex">
						{links.map((l) => (
							<Link
								key={l.href}
								href={l.href}
								className={
									"flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition " +
									(isActive(l.href) ? "bg-white/10 text-white" : "text-white/60 hover:text-white")
								}
							>
								<l.Icon className="h-4 w-4" />
								{l.label}
							</Link>
						))}
					</nav>
				</div>
			</header>

			<nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#0E0E12]/90 backdrop-blur sm:hidden">
				<div className="flex items-stretch justify-around">
					{links.map((l) => (
						<Link
							key={l.href}
							href={l.href}
							className={
								"flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition " +
								(isActive(l.href) ? "text-[#FF2D6B]" : "text-white/55")
							}
						>
							<l.Icon className="h-5 w-5" />
							{l.label}
						</Link>
					))}
				</div>
			</nav>
		</>
	)
}