"use client"

import { useEffect, useState } from "react"

type GeoState = {
	city: string | null
	loading: boolean
	error: string | null
}

export function useGeolocation() {
	const [state, setState] = useState<GeoState>({ city: null, loading: true, error: null })

	useEffect(() => {
		if (!("geolocation" in navigator)) {
			setState({ city: null, loading: false, error: "Geolocalizzazione non supportata dal browser." })
			return
		}

		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					const { latitude, longitude } = pos.coords
					const res = await fetch(
						"https://nominatim.openstreetmap.org/reverse?format=json&lat=" +
							latitude +
							"&lon=" +
							longitude +
							"&zoom=10&addressdetails=1",
						{ headers: { "User-Agent": "Encore/1.0 ( m.demiri@hotmail.it )" } },
					)
					if (!res.ok) {
						setState({ city: null, loading: false, error: null })
						return
					}
					const data = await res.json()
					const addr = data.address ?? {}
					const city =
						addr.city || addr.town || addr.municipality || addr.village || null
					if (!city) {
						setState({ city: null, loading: false, error: null })
						return
					}
					// Capitalize
					const name = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
					setState({ city: name, loading: false, error: null })
				} catch {
					setState({ city: null, loading: false, error: null })
				}
			},
			() => {
				setState({ city: null, loading: false, error: "Permesso geolocalizzazione negato." })
			},
		)
	}, [])

	return state
}