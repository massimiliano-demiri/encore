"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mail, Lock, ArrowRight, CheckCircle2, User, Eye, EyeOff, Sparkles } from "lucide-react"

type Mode = "login" | "signup" | "magic"

export default function LoginPage() {
	const [mode, setMode] = useState<Mode>("login")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [showPw, setShowPw] = useState(false)
	const [username, setUsername] = useState("")
	const [displayName, setDisplayName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [sent, setSent] = useState(false)
	const supabase = createClient()
	const router = useRouter()

	// ─── Login email+password ───
	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!supabase || !email.trim() || !password) return
		setError(null)
		setLoading(true)
		const { error: err } = await supabase.auth.signInWithPassword({ email, password })
		setLoading(false)
		if (err) {
			setError(
				err.message === "Invalid login credentials" || err.code === "invalid_credentials"
					? "Email o password errati."
					: err.message,
			)
			return
		}
		router.push("/me")
	}

	// ─── Registrazione email+password ───
	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!supabase || !email.trim() || !password) return
		if (password.length < 6) {
			setError("La password deve avere almeno 6 caratteri.")
			return
		}
		const clean = username.toLowerCase().trim().replace(/[^a-z0-9._]/g, "")
		if (clean.length < 3) {
			setError("Lo username deve avere almeno 3 caratteri (lettere, numeri, . o _).")
			return
		}
		setError(null)
		setLoading(true)
		const { error: err, data } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { display_name: displayName.trim() || clean },
			},
		})
		setLoading(false)
		if (err) {
			if (err.code === "user_already_exists" || err.message?.includes("already registered")) {
				setError("Questa email è già registrata. Prova ad accedere.")
				setMode("login")
				return
			}
			if (err.code === "weak_password") {
				setError("Password troppo debole. Usa almeno 6 caratteri.")
				return
			}
			setError(err.message)
			return
		}

		// Se la registrazione ha creato subito la sessione (email non confermata = auto-confirm)
		if (data.session && data.user) {
			await supabase
				.from("profiles")
				.update({ username: clean, display_name: displayName.trim() || clean })
				.eq("id", data.user.id)
			router.push("/me")
		} else {
			// Email di conferma inviata
			setSent(true)
		}
	}

	// ─── Magic link (fallback) ───
	const handleMagic = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!supabase || !email.trim()) return
		setError(null)
		setLoading(true)
		const { error: err } = await supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/me` },
		})
		setLoading(false)
		if (!err) setSent(true)
	}

	// ─── Stato "email inviata" (magic link o conferma registrazione) ───
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
					<div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
						<CheckCircle2 className="h-10 w-10 text-[#FF2D6B]" />
						<p className="font-medium">Controlla la tua email</p>
						<p className="text-sm text-white/50">
							{mode === "magic"
								? "Ti ho mandato un link per entrare."
								: "Ti ho mandato un link per confermare la registrazione."}
						</p>
						<p className="text-xs text-white/30">{email}</p>
					</div>
				</div>
			</main>
		)
	}

	// ─── Form ───
	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
			<div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF2D6B]/20 blur-[130px]" />
			<div className="relative w-full max-w-sm">
				<div className="mb-8 text-center">
					<h1 className="text-4xl font-bold [font-family:var(--font-display)]">
						Enc<span className="text-[#FF2D6B]">o</span>re
					</h1>
					<p className="mt-2 text-sm text-white/50">Ogni live, per sempre.</p>
				</div>

				{/* Toggle login / signup */}
				<div className="mb-3 flex rounded-xl bg-white/[0.03] border border-white/10 p-0.5">
					<button
						onClick={() => { setMode("login"); setError(null) }}
						className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
							mode === "login" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
						}`}
					>
						Accedi
					</button>
					<button
						onClick={() => { setMode("signup"); setError(null) }}
						className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
							mode === "signup" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
						}`}
					>
						Registrati
					</button>
				</div>

				<div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
					{/* Email */}
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
						<input
							type="email"
							placeholder="La tua email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]"
						/>
					</div>

					{/* Password (non serve per magic link) */}
					{mode !== "magic" && (
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
							<input
								type={showPw ? "text" : "password"}
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-9 pr-10 text-sm outline-none transition focus:border-[#FF2D6B]"
							/>
							<button
								type="button"
								onClick={() => setShowPw(!showPw)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
							>
								{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
					)}

					{/* Campi extra registrazione */}
					{mode === "signup" && (
						<>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
								<input
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="Username (es. massi)"
									className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]"
								/>
							</div>
							<div className="relative">
								<User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
								<input
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									placeholder="Nome visualizzato (facoltativo)"
									className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF2D6B]"
								/>
							</div>
						</>
					)}

					{error && <p className="text-sm text-red-400">{error}</p>}

					{/* Bottone principale */}
					<button
						onClick={
							mode === "login"
								? handleLogin
								: mode === "signup"
									? handleSignup
									: handleMagic
						}
						disabled={loading || !email.trim() || (mode !== "magic" && !password)}
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF2D6B] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
					>
						{loading
							? "Carico…"
							: mode === "login"
								? "Accedi"
								: mode === "signup"
									? "Crea account"
									: "Invia link magico"}
						{!loading && <ArrowRight className="h-4 w-4" />}
					</button>

					{/* Toggle magic link */}
					{mode === "magic" ? (
						<button
							type="button"
							onClick={() => { setMode("login"); setError(null) }}
							className="text-center text-xs text-white/35 hover:text-white/60"
						>
							Torna ad Accedi con password
						</button>
					) : (
						<button
							type="button"
							onClick={() => { setMode("magic"); setError(null) }}
							className="inline-flex items-center justify-center gap-1 text-xs text-white/35 hover:text-white/60"
						>
							<Sparkles className="h-3 w-3" /> Entra senza password
						</button>
					)}
				</div>
			</div>
		</main>
	)
}