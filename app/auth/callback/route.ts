import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url)
	const code = searchParams.get("code")

	if (!code) {
		console.error("Auth callback: nessun code nella URL")
		return NextResponse.redirect(`${origin}/login?error=no_code`)
	}

	// next può arrivare come path relativo (/me) o come URL assoluto
	const nextRaw = searchParams.get("next") ?? "/me"
	const next = nextRaw.startsWith("http") ? nextRaw : `${origin}${nextRaw}`

	try {
		const cookieStore = await cookies()
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll()
					},
					setAll(cookiesToSet) {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options)
						}
					},
				},
			},
		)

		const { error } = await supabase.auth.exchangeCodeForSession(code)
		if (error) {
			console.error("Auth callback: exchangeCodeForSession fallito", error.message)
			return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
		}
	} catch (err) {
		console.error("Auth callback: eccezione", err)
		return NextResponse.redirect(`${origin}/login?error=exception`)
	}

	return NextResponse.redirect(next)
}