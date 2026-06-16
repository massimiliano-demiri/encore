"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mail, Lock, Eye, EyeOff, User, MapPin, ArrowRight, CheckCircle2 } from "lucide-react"

export default function SignupPage() {
	const supabase = createClient()
	const router = useRouter()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [showPw, setShowPw] = useState(false)
	const [username, setUsername] = useState("")
	const [displayName, setDisplayName] = useState("")
	const [city, setCity] = useState("")
	const [citySuggestions, setCitySuggestions] = useState<string[]>([])
	const [cityOpen, setCityOpen] = useState(false)
	const [cityLoading, setCityLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [sent, setSent] = useState(false)
	const cityRef = useRef<HTMLDivElement>(null)
	const cityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false)
		}
		document.addEventListener("mousedown", handler)
		return () => document.removeEventListener("mousedown", handler)
	}, [])

	const fetchCities = (q: string) => {
		if (q.length < 2) { setCitySuggestions([]); setCityOpen(false); return }
		setCityLoading(true)
		fetch("/api/cities?q=" + encodeURIComponent(q))
			.then((r) => r.json())
			.then((d) => { setCitySuggestions(d.cities ?? []); setCityOpen((d.cities ?? []).length > 0); setCityLoading(false) })
			.catch(() => setCityLoading(false))
	}

	const handleCityChange = (value: string) => {
		setCity(value)
		if (cityTimer.current) clearTimeout(cityTimer.current)
		cityTimer.current = setTimeout(() => fetchCities(value), 200)
	}

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!supabase || !email.trim() || !password) return
		if (password.length < 6) { setError("La password deve avere almeno 6 caratteri."); return }
		const clean = username.toLowerCase().trim().replace(/[^a-z0-9._]/g, "")
		if (clean.length < 3) { setError("Lo username deve avere almeno 3 caratteri (lettere, numeri, . o _)."); return }
		setError(null)
		setLoading(true)
		const { error: err, data } = await supabase.auth.signUp({ email, password })
		setLoading(false)
		if (err) {
			if (err.code === "user_already_exists" || err.message?.includes("already registered")) {
				setError("Questa email è già registrata. Prova ad accedere.")
				return
			}
			if (err.code === "weak_password") { setError("Password troppo debole."); return }
			setError(err.message)
			return
		}
		if (data.session && data.user) {
			await supabase.from("profiles").update({
				username: clean,
				display_name: displayName.trim() || clean,
				city: city.trim() || null,
			}).eq("id", data.user.id)
router.push("/welcome")		} else {
			setSent(true)
		}
	}

	if (sent) {
		return (
			<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
				<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF2D6B]/20 blur-[130px]" />
				<div className="relative w-full max-w-sm">
					<div className="mb-8 text-center">
						<h1 className="text-4xl font-bold [font-family:var(--font-display)]">
							Enc<span className="text-[#FF2D6B]">o</span>re
						</h1>
					</div>
					<div className="flex flex-col items-center gap-3 border border-white/10 bg-white/[0.02] p-8 text-center">
						<CheckCircle2 className="h-10 w-10 text-[#FF2D6B]" />
						<p className="font-medium">Ti ho mandato un'email</p>
						<p className="text-sm text-white/50">Controlla la posta e clicca il link per confermare.</p>
						<p className="text-xs text-white/30">{email}</p>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
			<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7A5CFF]/20 blur-[130px]" />
			<div className="relative w-full max-w-sm">
				<div className="mb-8 text-center">
					<Link href="/" className="text-4xl font-bold [font-family:var(--font-display)]">
						Enc<span className="text-[#FF2D6B]">o</span>re
					</Link>
					<p className="mt-2 text-sm text-white/50">Ogni live, per sempre.</p>
				</div>

				<div className="mb-2">
					<h2 className="text-xl font-bold [font-family:var(--font-display)]">Crea il tuo account</h2>
					<p className="mt-1 text-sm text-white/40">Tieni il diario dei concerti a cui sei stato.</p>
				</div>

				<form onSubmit={handleSignup} className="flex flex-col gap-3">
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
							className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]" />
					</div>
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input type={showPw ? "text" : "password"} placeholder="Password (min 6 caratteri)" value={password} onChange={(e) => setPassword(e.target.value)}
							className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-10 text-sm outline-none transition focus:border-[#FF2D6B]" />
						<button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
							{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					<div className="relative">
						<User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (es. massi)"
							className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]" />
					</div>
					<div className="relative">
						<User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nome visualizzato (facoltativo)"
							className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]" />
					</div>
					<div className="relative" ref={cityRef}>
						<MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input value={city} onChange={(e) => handleCityChange(e.target.value)}
							onFocus={() => { if (city.length >= 2) fetchCities(city) }}
							placeholder="Città (facoltativo)" autoComplete="off"
							className="w-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]" />
						{cityOpen && citySuggestions.length > 0 && (
							<ul className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto border border-white/10 bg-[#1a1a22] shadow-xl">
								{cityLoading && <li className="px-3 py-2 text-xs text-white/30">Cerco…</li>}
								{citySuggestions.map((c) => (
									<li key={c}>
										<button type="button" onClick={() => { setCity(c); setCityOpen(false) }}
											className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white transition">{c}</button>
									</li>
								))}
							</ul>
						)}
					</div>

					{error && <p className="text-sm text-red-400">{error}</p>}

					<button disabled={loading || !email.trim() || !password} type="submit"
						className="inline-flex items-center justify-center gap-2 bg-[#FF2D6B] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40">
						{loading ? "Creazione account…" : "Crea account"} {!loading && <ArrowRight className="h-4 w-4" />}
					</button>
				</form>

				<p className="mt-4 text-center text-sm text-white/40">
					Hai già un account?{" "}
					<Link href="/login" className="text-[#FF2D6B] hover:underline">Accedi</Link>
				</p>
			</div>
		</main>
	)
}