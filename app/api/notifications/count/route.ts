import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !key) return null
	return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(request: Request) {
	const admin = getAdmin()
	if (!admin) return NextResponse.json({ count: 0 })

	const authHeader = request.headers.get("authorization")
	if (!authHeader) return NextResponse.json({ count: 0 })

	const token = authHeader.replace("Bearer ", "")
	const {
		data: { user },
	} = await admin.auth.getUser(token)
	if (!user) return NextResponse.json({ count: 0 })

	const { count } = await admin
		.from("notifications")
		.select("*", { count: "exact", head: true })
		.eq("user_id", user.id)
		.eq("read", false)

	return NextResponse.json({ count: count ?? 0 })
}