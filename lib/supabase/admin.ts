import { createClient } from "@supabase/supabase-js"

// Usa la service_role key: SOLO lato server, mai nel browser.
// Nota: su alcuni ambienti (es. Vercel build) questi env non sono disponibili
// durante l'"evaluation" del modulo. Rendiamo l'istanza lazily, e falliamo
// con un errore chiaro solo quando l'istanza è realmente usata.
export const getSupabaseAdmin = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !serviceRoleKey) {
		throw new Error(
			"supabase env missing: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
		)
	}

	return createClient(url, serviceRoleKey, {
		auth: { persistSession: false },
	})
}

