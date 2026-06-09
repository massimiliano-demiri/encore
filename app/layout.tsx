import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { NavBar } from "@/components/ui/nav-bar"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-display",
})

export const metadata: Metadata = {
	title: "Encore — Ogni live, per sempre.",
	description: "Il diario dei tuoi concerti.",
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="it" className={`dark ${inter.variable} ${spaceGrotesk.variable}`}>
			<body className="min-h-screen bg-[#0E0E12] text-[#F4F4F6] antialiased [font-family:var(--font-inter)]">
				<NavBar />
				{children}
			</body>
		</html>
	)
}