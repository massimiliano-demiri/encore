import { createBrowserClient } from "@supabase/ssr"

// Nota: su Vercel durante build/eval possono mancare le env.
// Per evitare crash ("Your project's URL and API key are required"),
// rendiamo createClient resiliente: se manca le env, non creiamo il client.
export const createClient = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	if (!url || !anonKey) return null

	return createBrowserClient(url, anonKey)
}

