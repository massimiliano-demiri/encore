"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Calendar, MapPin } from "lucide-react"

const icon = L.icon({
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})

type ConcertMarker = {
	id: string
	lat: number
	lng: number
	name: string
	venue: string
	date: string
	city: string
	rsvpCount: number
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
	const map = useMap()
	useEffect(() => {
		map.flyTo([lat, lng], 13, { duration: 1 })
	}, [lat, lng, map])
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
	const center: [number, number] =
		userLat && userLng
			? [userLat, userLng]
			: markers[0]
				? [markers[0].lat, markers[0].lng]
				: [41.9028, 12.4964]

	return (
		<div className="h-[400px] w-full overflow-hidden border border-white/10">
			<MapContainer
				center={center}
				zoom={12}
				className="h-full w-full"
				scrollWheelZoom={false}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				{userLat && userLng && <FlyTo lat={userLat} lng={userLng} />}
				{markers.map((m) => (
					<Marker key={m.id} position={[m.lat, m.lng]} icon={icon}>
						<Popup>
							<div className="text-sm">
								<p className="font-bold mb-1">{m.name}</p>
								<p className="text-xs text-gray-600 flex items-center gap-1">
									<MapPin className="h-3 w-3" /> {m.venue}, {m.city}
								</p>
								<p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
									<Calendar className="h-3 w-3" /> {fmtDate(m.date)}
								</p>
								{m.rsvpCount > 0 && (
									<p className="text-xs font-medium text-[#FF2D6B] mt-1">
										{m.rsvpCount} {m.rsvpCount === 1 ? "persona" : "persone"} parteciperà
									</p>
								)}
								<a
									href={"/concert/" + m.id}
									className="mt-1.5 inline-block text-xs font-medium text-[#FF2D6B] hover:underline"
								>
									Vedi dettagli →
								</a>
							</div>
						</Popup>
					</Marker>
				))}
			</MapContainer>
		</div>
	)
}