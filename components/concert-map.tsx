"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Calendar, MapPin } from "lucide-react"

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
	ticketUrl: string | null
}

function createArtistIcon(imageUrl: string | null, name: string): L.DivIcon {
	const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
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
	return L.divIcon({ html, className: "", iconSize: [size + 4, size + 12], iconAnchor: [(size + 4) / 2, size + 12], popupAnchor: [0, -(size + 14)] })
}

function FitBounds({ markers, userLat, userLng }: {
	markers: [number, number][]
	userLat: number | null
	userLng: number | null
}) {
	const map = useMap()
	useEffect(() => {
		const allPoints: [number, number][] = [
			...markers,
			...(userLat && userLng ? [[userLat, userLng] as [number, number]] : []),
		]
		if (allPoints.length === 0) return
		if (allPoints.length === 1) {
			map.setView(allPoints[0], 12, { animate: true })
			return
		}
		const bounds = L.latLngBounds(allPoints)
		map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13, animate: true })
	}, [markers, userLat, userLng, map])
	return null
}

const fmtDate = (d: string) =>
	new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })

export function ConcertMap({
	markers, userLat, userLng,
}: {
	markers: ConcertMarker[]
	userLat: number | null
	userLng: number | null
}) {
	// Se non ci sono marker ma abbiamo la posizione utente, centra lì con zoom 12
	const defaultCenter: [number, number] =
		userLat && userLng ? [userLat, userLng] : [41.9028, 12.4964]
	const defaultZoom = markers.length > 0 ? 10 : (userLat && userLng ? 12 : 6)

	const positions = useMemo(() => markers.map((m) => [m.lat, m.lng] as [number, number]), [markers])

	return (
		<div className="h-[380px] w-full overflow-hidden border border-white/10">
			<MapContainer
				center={defaultCenter}
				zoom={defaultZoom}
				className="h-full w-full"
				scrollWheelZoom={false}
				zoomControl={true}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					url="{{https://tile.openstreetmap.org/{z}}}/{x}/{y}.png"
				/>
				{/* Se non ci sono marker, punta comunque sulla posizione utente */}
				{userLat && userLng && (
					<FitBounds markers={positions} userLat={userLat} userLng={userLng} />
				)}
				{markers.map((m) => (
					<Marker key={m.id} position={[m.lat, m.lng]} icon={createArtistIcon(m.artistImage, m.name)}>
						<Popup>
							<div className="min-w-[160px] text-sm">
								<p className="font-bold mb-1 text-sm [font-family:var(--font-display)]">{m.name}</p>
								<p className="text-xs text-gray-600 flex items-center gap-1">
									<MapPin className="h-3 w-3" /> {m.venue}, {m.city}
								</p>
								<p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
									<Calendar className="h-3 w-3" /> {fmtDate(m.date)}
								</p>
								<a href={"/concert/" + m.id}
									className="mt-1.5 inline-block text-xs font-semibold text-[#FF2D6B] hover:underline">
									Vedi concerto →
								</a>
								{m.ticketUrl && (
									<a href={m.ticketUrl} target="_blank" rel="noopener"
										className="mt-0.5 ml-2 inline-block text-xs font-semibold text-[#7A5CFF] hover:underline">
										Biglietti ↗
									</a>
								)}
							</div>
						</Popup>
					</Marker>
				))}
				{/* Marker della posizione utente */}
				{userLat && userLng && markers.length === 0 && (
					<Marker
						position={[userLat, userLng]}
						icon={L.divIcon({
							html: `<div style="width:14px;height:14px;border-radius:50%;background:#FF2D6B;border:3px solid #fff;box-shadow:0 0 10px rgba(255,45,107,0.5);"></div>`,
							className: "",
							iconSize: [14, 14],
							iconAnchor: [7, 7],
						})}
					>
						<Popup>
							<div className="text-sm font-semibold">Sei qui</div>
						</Popup>
					</Marker>
				)}
			</MapContainer>
		</div>
	)
}