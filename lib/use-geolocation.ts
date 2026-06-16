"use client"

import { useEffect, useState } from "react"

type GeoState = {
	city: string | null
	lat: number | null
	lng: number | null
	loading: boolean
	error: string | null
}

const GEO_TIMEOUT_MS = 8000

export function useGeolocation(fallbackCity?: string | null) {
	const [state, setState] = useState<GeoState>({
		city: null,
		lat: null,
		lng: null,
		loading: true,
		error: null,
	})

	useEffect(() => {
		let cancelled = false
		let safety: ReturnType<typeof setTimeout> | null = null

		const clearSafety = () => {
			if (safety) {
				clearTimeout(safety)
				safety = null
			}
		}

		if (!("geolocation" in navigator)) {
			setState((s) => ({
				...s,
				city: fallbackCity ?? null,
				loading: false,
				error: "Geolocalizzazione non supportata dal browser.",
			}))
			return
		}

		// Timer di sicurezza: il prompt dei permessi NON conta nel timeout nativo,
		// quindi se l'utente lo ignora getCurrentPosition non chiama mai i callback.
		safety = setTimeout(() => {
			if (cancelled) return
			setState((s) =>
				// Se nel frattempo è già arrivata una posizione, non sovrascrivere.
				s.lat !== null
					? s
					: { ...s, city: fallbackCity ?? null, loading: false, error: "Posizione non disponibile (timeout)." },
			)
		}, GEO_TIMEOUT_MS)

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				clearSafety()
				if (cancelled) return
				const { latitude, longitude } = pos.coords
				// Sblocca subito la UI: lat/lng pronti, città sul fallback per ora.
				setState({ city: fallbackCity ?? null, lat: latitude, lng: longitude, loading: false, error: null })
				// Reverse-geocoding in background — non blocca il caricamento.
				fetch(
					"https://nominatim.openstreetmap.org/reverse?format=json&lat=" +
						latitude +
						"&lon=" +
						longitude +
						"&zoom=10&addressdetails=1",
				)
					.then((res) => (res.ok ? res.json() : null))
					.then((data) => {
						if (cancelled || !data) return
						const addr = data.address ?? {}
						const rawCity = addr.city || addr.town || addr.municipality || addr.village || null
						if (!rawCity) return
						const city = rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase()
						setState((s) => ({ ...s, city }))
					})
					.catch(() => {
						/* la città resta sul fallback; lat/lng sono comunque validi */
					})
			},
			(err) => {
				clearSafety()
				if (cancelled) return
				setState((s) => ({
					...s,
					city: fallbackCity ?? null,
					loading: false,
					error:
						err.code === err.PERMISSION_DENIED
							? "Permesso geolocalizzazione negato."
							: err.code === err.TIMEOUT
								? "Posizione non disponibile (timeout)."
								: "Impossibile determinare la posizione.",
				}))
			},
			{ enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 10 * 60 * 1000 },
		)

		return () => {
			cancelled = true
			clearSafety()
		}
	}, [fallbackCity])

	return state
}