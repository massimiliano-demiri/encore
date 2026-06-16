"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Calendar } from "lucide-react"

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
	priceMin: number | null
	priceCurrency: string | null
}

function createArtistIcon(imageUrl: string | null, name: string): L.DivIcon {
	const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
	const size = 42
	const innerSize = 32
	const html = imageUrl
		? `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;position:relative;">
				<div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,#FF2D6B,#7A5CFF);opacity:0.7;transform:scale(1.12);"></div>
				<img src="${imageUrl}" style="width:${innerSize}px;height:${innerSize}px;border-radius:50%;object-fit:cover;position:relative;z-index:1;border:2px solid #0E0E12;" alt="${name}" />
				<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:#FF2D6B;border-radius:50%;border:2px solid #0E0E12;"></div>
			</div>`
		: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;position:relative;">
				<div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,#FF2D6B,#7A5CFF);opacity:0.7;transform:scale(1.12);"></div>
				<div style="width:${innerSize}px;height:${innerSize}px;border-radius:50%;background:linear-gradient(135deg,rgba(255,45,107,0.6),rgba(122,92,255,0.6));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:white;position:relative;z-index:1;border:2px solid #0E0E12;font-family:system-ui,sans-serif;">${initials}</div>
				<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:#FF2D6B;border-radius:50%;border:2px solid #0E0E12;"></div>
			</div>`
	return L.divIcon({ html, className: "", iconSize: [size + 4, size + 10], iconAnchor: [(size + 4) / 2, size + 10], popupAnchor: [0, -(size + 12)] })
}

function FitBounds({ markers, userLat, userLng }: {
	markers: [number, number][]
	userLat: number | null
	userLng: number | null
}) {
	const map = useMap()
	useEffect(() => {
		if (markers.length === 0 && userLat && userLng) {
			map.setView([userLat, userLng], 13, { animate: true })
			return
		}
		const allPoints: [number, number][] = [
			...markers,
			...(userLat && userLng ? [[userLat, userLng] as [number, number]] : []),
		]
		if (allPoints.length === 0) return
		if (allPoints.length === 1) {
			map.setView(allPoints[0], 13, { animate: true })
			return
		}
		const bounds = L.latLngBounds(allPoints)
		map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true })
	}, [markers, userLat, userLng, map])
	return null
}

const fmtDateShort = (d: string) =>
	new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })

const fmtPrice = (priceMin: number | null, priceCurrency: string | null): string | null => {
	if (priceMin == null) return null
	if (priceCurrency === "EUR") return "da €" + priceMin
	if (priceCurrency === "USD") return "da $" + priceMin
	return "da " + priceMin + " " + (priceCurrency ?? "")
}

export function ConcertMap({
	markers, userLat, userLng,
}: {
	markers: ConcertMarker[]
	userLat: number | null
	userLng: number | null
}) {
	const defaultCenter: [number, number] = userLat && userLng ? [userLat, userLng] : [41.9028, 12.4964]
	const defaultZoom = markers.length > 0 ? 10 : (userLat && userLng ? 13 : 6)
	const positions = useMemo(() => markers.map((m) => [m.lat, m.lng] as [number, number]), [markers])

	return (
		<div className="h-[400px] w-full overflow-hidden border border-white/10 dark-map">
			<MapContainer
				center={defaultCenter}
				zoom={defaultZoom}
				className="h-full w-full"
				scrollWheelZoom={false}
				zoomControl={false}
			>
				<TileLayer
					attribution=""
					url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<FitBounds markers={positions} userLat={userLat} userLng={userLng} />
				{markers.map((m) => {
					const price = fmtPrice(m.priceMin, m.priceCurrency)
					return (
						<Marker key={m.id} position={[m.lat, m.lng]} icon={createArtistIcon(m.artistImage, m.name)}>
							<Popup>
								<div className="w-[180px]">
									{/* Nome artista */}
																					<p className="font-bold text-sm leading-tight" style={{ margin: 0 }}>{m.name}</p>

																					{/* Data · città — una sola riga compatta */}
																					<p className="text-xs opacity-60 flex items-center gap-1 mt-1" style={{ margin: "4px 0 0" }}>
																						<Calendar className="h-3 w-3 shrink-0" />
																						<span className="truncate">{fmtDateShort(m.date)} · {m.city}</span>
																					</p>

																					{/* Azione primaria */}
																					<a
																						href={"/concert/" + m.id}
																						className="mt-2 block w-full rounded bg-[#FF2D6B] px-3 py-1.5 text-center text-xs font-bold text-white no-underline"
																						style={{ marginTop: 8 }}
																					>
																						Vedi concerto →
																					</a>

																					{/* Biglietti — azione secondaria, con prezzo se disponibile */}
																					{m.ticketUrl && (
																						<a
																							href={m.ticketUrl}
																							target="_blank"
																							rel="noopener"
																							className="mt-1.5 block text-center text-xs font-medium text-[#7A5CFF] hover:underline"
																							style={{ marginTop: 6 }}
																						>
																							Biglietti{price ? " · " + price : ""} ↗
																						</a>
																					)}
																					</div>
							</Popup>
						</Marker>
					)
				})}
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
						<Popup><div className="text-sm font-semibold">Sei qui</div></Popup>
					</Marker>
				)}
			</MapContainer>
		</div>
	)
}