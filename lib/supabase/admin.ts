import { createClient } from "@supabase/supabase-js"

// Usa la service_role key: SOLO lato server, mai nel browser.
export const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { persistSession: false } },
)