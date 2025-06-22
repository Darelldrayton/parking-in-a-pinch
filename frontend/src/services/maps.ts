import { Loader } from '@googlemaps/js-api-loader'

// Google Maps configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Default NYC coordinates
export const DEFAULT_CENTER = {
  lat: 40.7589,
  lng: -73.9851
}

export const DEFAULT_ZOOM = 12

// Initialize Google Maps loader
export const mapsLoader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places', 'geometry']
})

// Geocoding service
export class GeocodingService {
  private static geocoder: google.maps.Geocoder | null = null

  static async init() {
    if (!this.geocoder) {
      await mapsLoader.load()
      this.geocoder = new google.maps.Geocoder()
    }
    return this.geocoder
  }

  // Convert address to coordinates
  static async geocodeAddress(address: string): Promise<{
    lat: number
    lng: number
    formattedAddress: string
  } | null> {
    try {
      const geocoder = await this.init()
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formattedAddress: results[0].formatted_address
            })
          } else {
            resolve(null)
          }
        })
      })
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  // Convert coordinates to address
  static async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const geocoder = await this.init()
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].formatted_address)
          } else {
            resolve(null)
          }
        })
      })
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }
}

// Map utilities
export class MapUtils {
  // Calculate distance between two points
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1)
    const dLng = this.deg2rad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  // Get map bounds that contain all markers
  static getBoundsForMarkers(markers: Array<{ lat: number; lng: number }>) {
    if (markers.length === 0) return null

    let minLat = markers[0].lat
    let maxLat = markers[0].lat
    let minLng = markers[0].lng
    let maxLng = markers[0].lng

    markers.forEach(marker => {
      minLat = Math.min(minLat, marker.lat)
      maxLat = Math.max(maxLat, marker.lat)
      minLng = Math.min(minLng, marker.lng)
      maxLng = Math.max(maxLng, marker.lng)
    })

    return {
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng
    }
  }
}

// Parking marker icons - will be initialized after Google Maps loads
export const getParkingMarkers = () => ({
  available: {
    path: typeof google !== 'undefined' ? google.maps.SymbolPath.CIRCLE : 0,
    fillColor: '#10B981',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 8
  },
  occupied: {
    path: typeof google !== 'undefined' ? google.maps.SymbolPath.CIRCLE : 0,
    fillColor: '#EF4444',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 8
  },
  reserved: {
    path: typeof google !== 'undefined' ? google.maps.SymbolPath.CIRCLE : 0,
    fillColor: '#F59E0B',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 8
  },
  selected: {
    path: typeof google !== 'undefined' ? google.maps.SymbolPath.CIRCLE : 0,
    fillColor: '#3B82F6',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
    scale: 10
  }
})