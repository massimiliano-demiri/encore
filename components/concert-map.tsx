"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Calendar, MapPin, Users } from "lucide-react"

type ConcertMarker = {
	id: string
	lat: number
	lng: number
	name: string
	venue: string
	date: string
	city: string
	rsvpCount: number
	artistImage: string | null
}

function createArtistIcon(imageUrl: string | null, name: string): L.DivIcon {
	const initials = name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()

	const size = 44
	const innerSize = 34

	const html = imageUrl
		? `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;position:relative;">
				<div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,#FF2D6B,#7A5CFF);opacity:0.7;transform:scale(1.15);"></div>
				<img src="${imageUrl}" style="width:${innerSize}px;height:${innerSize}px;border-radius:50%;object-fit:cover;position:relative;z-index:1;border:2px solid #0E0E12;" alt="${name}" />
				<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:10px;height:10px;background:#FF2D6B;border-radius:50%;border:2px solid #0E0E12;"></div>
			</div>`
		: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;position:relative;">
				<div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,#FF2D6B,#7A5CFF);opacity:0.7;transform:scale(1.15);"></div>
				<div style="width:${innerSize}px;height:${innerSize}px;border-radius:50%;background:linear-gradient(135deg,rgba(255,45,107,0.6),rgba(122,92,255,0.6));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:white;position:relative;z-index:1;border:2px solid #0E0E12;font-family:system-ui,sans-serif;">${initials}</div>
				<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:10px;height:10px;background:#FF2D6B;border-radius:50%;border:2px solid #0E0E12;"></div>
			</div>`

	return L.divIcon({
		html,
		className: "",
		iconSize: [size + 4, size + 12],
		iconAnchor: [(size + 4) / 2, size + 12],
		popupAnchor: [0, -(size + 14)],
	})
}

function FitBounds({ markers, userLat, userLng }: { markers: [number, number][]; userLat: number | null; userLng: number | null }) {
	const map = useMap()
	useEffect(() => {
		if (markers.length === 0) return
		if (markers.length === 1) {
			map.setView(markers[0], 12, { animate: true })
			return
		}
		const bounds = L.latLngBounds(markers)
		map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true })
	}, [markers, userLat, userLng, map])
	return null
}

const fmtDate = (d: string) =>
	new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })

export function ConcertMap({
	markers,
	userLat,
	userLng,
}: {
	markers: ConcertMarker[]
	userLat: number | null
	userLng: number | null
}) {
	const defaultCenter: [number, number] =
		userLat && userLng ? [userLat, userLng] : [41.9028, 12.4964]

	const positions = useMemo(() => markers.map((m) => [m.lat, m.lng] as [number, number]), [markers])

	const mapKey = useMemo(
		() => markers.map((m) => m.id).join(",") + (userLat ?? "") + (userLng ?? ""),
		[markers, userLat, userLng],
	)

	return (
		<div className="h-[420px] w-full overflow-hidden border border-white/10">
			<MapContainer
				key={mapKey}
				center={defaultCenter}
				zoom={6}
				className="h-full w-full"
				scrollWheelZoom={false}
				zoomControl={true}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<FitBounds markers={positions} userLat={userLat} userLng={userLng} />
				{markers.map((m) => (
					<Marker
						key={m.id}
						position={[m.lat, m.lng]}
						icon={createArtistIcon(m.artistImage, m.name)}
					>
						<Popup>
							<div className="min-w-[180px] text-sm">
								<p className="font-bold mb-1.5 text-base [font-family:var(--font-display)]">{m.name}</p>
								<p className="text-xs text-gray-600 flex items-center gap-1">
									<MapPin className="h-3 w-3" /> {m.venue}, {m.city}
								</p>
								<p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
									<Calendar className="h-3 w-3" /> {fmtDate(m.date)}
								</p>
								{m.rsvpCount > 0 && (
									<p className="text-xs font-semibold text-[#FF2D6B] mt-1.5 flex items-center gap-1">
										<Users className="h-3 w-3" />
										{m.rsvpCount} {m.rsvpCount === 1 ? "persona" : "persone"} parteciperà
									</p>
								)}
								<a
									href={"/concert/" + m.id}
									className="mt-2 inline-block text-xs font-semibold text-[#FF2D6B] hover:underline"
								>
									Vedi concerto →
								</a>
							</div>
						</Popup>
					</Marker>
				))}
			</MapContainer>
		</div>
	)
}