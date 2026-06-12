"use client"

import { useEffect, useState } from "react"

type GeoState = {
	city: string | null
	lat: number | null
	lng: number | null
	loading: boolean
	error: string | null
}

export function useGeolocation(fallbackCity?: string | null) {
	const [state, setState] = useState<GeoState>({
		city: null,
		lat: null,
		lng: null,
		loading: true,
		error: null,
	})

	useEffect(() => {
		if (!("geolocation" in navigator)) {
			setState((s) => ({
				...s,
				city: fallbackCity ?? null,
				loading: false,
				error: "Geolocalizzazione non supportata dal browser.",
			}))
			return
		}

		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const { latitude, longitude } = pos.coords
				try {
					const res = await fetch(
						"https://nominatim.openstreetmap.org/reverse?format=json&lat=" +
							latitude +
							"&lon=" +
							longitude +
							"&zoom=10&addressdetails=1",
						{ headers: { "User-Agent": "Encore/1.0 ( m.demiri@hotmail.it )" } },
					)
					if (res.ok) {
						const data = await res.json()
						const addr = data.address ?? {}
						const rawCity = addr.city || addr.town || addr.municipality || addr.village || null
						const city = rawCity
							? rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase()
							: null
						setState({ city, lat: latitude, lng: longitude, loading: false, error: null })
					} else {
						setState({ city: fallbackCity ?? null, lat: latitude, lng: longitude, loading: false, error: null })
					}
				} catch {
					setState({ city: fallbackCity ?? null, lat: latitude, lng: longitude, loading: false, error: null })
				}
			},
			() => {
				setState((s) => ({
					...s,
					city: fallbackCity ?? null,
					loading: false,
					error: "Permesso geolocalizzazione negato.",
				}))
			},
		)
	}, [fallbackCity])

	return state
}