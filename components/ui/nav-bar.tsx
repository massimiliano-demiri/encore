"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Search, Newspaper, User, ListMusic, LogOut, LogIn, MapPin, Bell } from "lucide-react"
import { useUser } from "@/lib/use-user"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"


const desktopLinks = [
	{ href: "/", label: "Home", Icon: Home },
	{ href: "/search", label: "Cerca", Icon: Search },
	{ href: "/feed", label: "Feed", Icon: Newspaper },
	{ href: "/nearby", label: "Vicino", Icon: MapPin },
	{ href: "/lists", label: "Liste", Icon: ListMusic },
	{ href: "/me", label: "Profilo", Icon: User },
]

const mobileLinks = [
	{ href: "/", label: "Home", Icon: Home },
	{ href: "/nearby", label: "Vicino", Icon: MapPin },
	{ href: "/search", label: "Cerca", Icon: Search },
]

export function NavBar() {
	const pathname = usePathname()
	const router = useRouter()
	const { user } = useUser()
	const supabase = createClient()
	const [unread, setUnread] = useState(0)

	const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

	const handleLogout = async () => {
		if (!supabase) return
		await supabase.auth.signOut()
		router.push("/")
	}

	useEffect(() => {
		if (!supabase || !user) { setUnread(0); return }
		const check = async () => {
			const { data: session } = await supabase.auth.getSession()
			if (!session?.session) return
			try {
				const res = await fetch("/api/notifications/count", {
					headers: { Authorization: "Bearer " + session.session.access_token },
				})
				const json = await res.json()
				setUnread(json.count ?? 0)
			} catch { /* ignore */ }
		}
		check()
		const interval = setInterval(check, 30000)
		return () => clearInterval(interval)
	}, [supabase, user])

	return (
		<>
			{/* Desktop header */}
			<header className="sticky top-0 z-30 border-b border-white/10 bg-[#0E0E12]/80 backdrop-blur">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
	<Link href="/" aria-label="Encore — home" className="inline-flex items-center">
	<Image
		src="/wordmark.png"
		alt="Encore"
		width={132}
		height={36}
		priority
		className="h-7 w-auto"
	/>
</Link>
					<nav className="hidden items-center gap-1 sm:flex">
						{desktopLinks.map((l) => (
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
						{user && (
							<Link
								href="/notifications"
								className={
									"relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition " +
									(isActive("/notifications") ? "bg-white/10 text-white" : "text-white/60 hover:text-white")
								}
							>
								<Bell className="h-4 w-4" />
								{unread > 0 && (
									<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF2D6B] px-1 text-[10px] font-bold text-white">
										{unread > 9 ? "9+" : unread}
									</span>
								)}
							</Link>
						)}
						{user ? (
							<button
								onClick={handleLogout}
								className="ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-white/40 transition hover:text-white"
								title="Esci"
							>
								<LogOut className="h-4 w-4" />
							</button>
						) : (
							<Link
								href="/login"
								className="ml-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/60 transition hover:text-white"
							>
								<LogIn className="h-4 w-4" />
								Accedi
							</Link>
						)}
					</nav>
				</div>
			</header>

			{/* Mobile bottom bar — 4 icone + badge notifiche sul Profilo */}
			<nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#0E0E12] pb-[env(safe-area-inset-bottom,0px)] sm:hidden">
				<div className="flex items-stretch justify-around">
					{mobileLinks.map((l) => (
						<Link
							key={l.href}
							href={l.href}
							className={
								"flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition " +
								(isActive(l.href) ? "text-[#FF2D6B]" : "text-white/55")
							}
						>
							<l.Icon className="h-5 w-5" />
							{l.label}
						</Link>
					))}
					{/* Profilo con badge notifiche */}
					{user ? (
						<Link
							href="/me"
							className={
								"relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition " +
								(isActive("/me") ? "text-[#FF2D6B]" : "text-white/55")
							}
						>
							<User className="h-5 w-5" />
							{unread > 0 && (
								<span className="absolute right-2 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF2D6B] px-1 text-[10px] font-bold text-white">
									{unread > 9 ? "9+" : unread}
								</span>
							)}
							Profilo
						</Link>
					) : (
						<Link
							href="/login"
							className={
								"flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition " +
								(isActive("/login") ? "text-[#FF2D6B]" : "text-white/55")
							}
						>
							<LogIn className="h-5 w-5" />
							Accedi
						</Link>
					)}
				</div>
			</nav>
		</>
	)
}	