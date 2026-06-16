import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { NavBar } from "@/components/ui/nav-bar"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" })

export const metadata: Metadata = {
	title: "Encore — Ogni live, per sempre.",
	description:
		"Il diario dei tuoi concerti: tieni traccia dei live che hai visto, dai un voto e scopri quelli degli altri.",
	appleWebApp: { capable: true, title: "Encore", statusBarStyle: "black-translucent" },
	manifest: "/manifest.json",
}

export const viewport: Viewport = { themeColor: "#0E0E12", viewportFit: "cover" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="it" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
			<body className="min-h-screen bg-[#0E0E12] text-[#F4F4F6] antialiased [font-family:var(--font-inter)] safe-top">
				<NavBar />
				<main className="pb-20 sm:pb-0">{children}</main>
				<Footer />
				<Toaster
					position="bottom-center"
					toastOptions={{
						style: {
							background: "#1a1a22",
							color: "#F4F4F6",
							border: "1px solid rgba(255,255,255,0.08)",
							fontSize: "14px",
						},
					}}
				/>
			</body>
		</html>
	)
}