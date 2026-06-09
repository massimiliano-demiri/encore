"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
	const [email, setEmail] = useState("")
	const [sent, setSent] = useState(false)
	const supabase = createClient()

	const signIn = async () => {
		const { error } = await supabase.auth.signInWithOtp({
			email,
options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/me` },		})
		if (!error) setSent(true)
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
			<h1 className="text-2xl font-bold">Encore</h1>
			{sent ? (
				<p>Controlla la tua email: ti ho mandato il link per entrare.</p>
			) : (
				<>
					<Input
						type="email"
						placeholder="La tua email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="max-w-xs"
					/>
					<Button onClick={signIn}>Entra con email</Button>
				</>
			)}
		</main>
	)
}