import Link from "next/link"
import { ArtistImage } from "./artsit-image"

export function ConcertPoster({
	concertId,
	artist,
	rating,
	subtitle,
}: {
	concertId: string
	artist: string
	rating?: number | null
	subtitle?: string
}) {
	return (
		<Link
			href={"/concert/" + concertId}
			className="group relative block aspect-[3/4] overflow-hidden rounded-xl"
		>
			<ArtistImage
				name={artist}
				className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-105"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
			<div className="absolute inset-x-0 bottom-0 p-3">
				<div className="line-clamp-2 text-sm font-semibold text-white">{artist}</div>
				{subtitle && <div className="text-xs text-white/70">{subtitle}</div>}
				{rating != null && (
					<div className="mt-1 inline-block rounded-full bg-[#FF2D6B] px-2 py-0.5 text-xs font-bold text-white">
						{rating}★
					</div>
				)}
			</div>
		</Link>
	)
}