import { useEffect, useRef, useState } from 'react'
import { Wrapper } from '@googlemaps/react-wrapper'
import { mapsLoader, DEFAULT_CENTER, DEFAULT_ZOOM, getParkingMarkers } from '../../services/maps'
import type { ParkingListing } from '../../types/parking'

interface MarkerData extends ParkingListing {
  status: 'available' | 'occupied' | 'reserved'
}

interface GoogleMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  markers?: MarkerData[]
  onMarkerClick?: (listing: ParkingListing) => void
  onMapClick?: (event: google.maps.MapMouseEvent) => void
  selectedMarkerId?: number
  showControls?: boolean
}

// Map component that renders the actual Google Map
function Map({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  onMarkerClick,
  onMapClick,
  selectedMarkerId,
  showControls = true
}: Omit<GoogleMapProps, 'height'>) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [mapMarkers, setMapMarkers] = useState<google.maps.Marker[]>([])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    const initMap = async () => {
      await mapsLoader.load()
      
      const mapInstance = new google.maps.Map(mapRef.current!, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: showControls,
        streetViewControl: showControls,
        fullscreenControl: showControls,
      })

      if (onMapClick) {
        mapInstance.addListener('click', onMapClick)
      }

      setMap(mapInstance)
    }

    initMap()
  }, [center.lat, center.lng, zoom, onMapClick, showControls])

  // Update markers when data changes
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    mapMarkers.forEach(marker => marker.setMap(null))

    // Create new markers
    const newMarkers = markers.map(markerData => {
      const isSelected = selectedMarkerId === markerData.id
      const parkingMarkers = getParkingMarkers()
      const markerIcon = isSelected 
        ? parkingMarkers.selected 
        : parkingMarkers[markerData.status]

      const marker = new google.maps.Marker({
        position: {
          lat: markerData.location.latitude,
          lng: markerData.location.longitude
        },
        map,
        icon: markerIcon,
        title: markerData.title,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined
      })

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-xs">
            <h3 class="font-semibold text-gray-900 mb-1">${markerData.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${markerData.location.address}</p>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-blue-600">$${markerData.pricing.hourly_rate}/hr</span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                markerData.status === 'available' 
                  ? 'bg-green-100 text-green-800'
                  : markerData.status === 'occupied'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }">
                ${markerData.status}
              </span>
            </div>
          </div>
        `
      })

      // Add click listeners
      marker.addListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(markerData)
        }
        infoWindow.open(map, marker)
      })

      // Close info window when clicking elsewhere
      map.addListener('click', () => {
        infoWindow.close()
      })

      return marker
    })

    setMapMarkers(newMarkers)

    // Fit map to markers if we have them
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      newMarkers.forEach(marker => {
        const position = marker.getPosition()
        if (position) bounds.extend(position)
      })
      map.fitBounds(bounds)
      
      // Don't zoom in too much for single markers
      google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const zoom = map.getZoom()
        if (zoom && zoom > 16) {
          map.setZoom(16)
        }
      })
    }
  }, [map, markers, selectedMarkerId, onMarkerClick])

  return <div ref={mapRef} className="w-full h-full" />
}

// Wrapper component with loading state
export default function GoogleMap({ 
  height = 'h-96', 
  ...mapProps 
}: GoogleMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className={`${height} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-6">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Google Maps API Key Required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            To enable interactive maps, add your Google Maps API key to the .env file:
          </p>
          <code className="text-xs bg-gray-200 px-2 py-1 rounded">
            VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
          </code>
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-400">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>Available</span>
            <div className="h-2 w-2 bg-red-500 rounded-full ml-4"></div>
            <span>Occupied</span>
            <div className="h-2 w-2 bg-yellow-500 rounded-full ml-4"></div>
            <span>Reserved</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${height} rounded-lg overflow-hidden shadow-sm border border-gray-200`}>
      <Wrapper
        apiKey={apiKey}
        version="weekly"
        libraries={['places', 'geometry']}
        render={(status) => {
          switch (status) {
            case 'LOADING':
              return (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading map...</p>
                  </div>
                </div>
              )
            case 'FAILURE':
              return (
                <div className="w-full h-full bg-red-50 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-4xl mb-4">❌</div>
                    <h3 className="text-lg font-medium text-red-900 mb-2">
                      Failed to Load Map
                    </h3>
                    <p className="text-sm text-red-600">
                      Please check your API key and internet connection
                    </p>
                  </div>
                </div>
              )
            case 'SUCCESS':
              return <Map {...mapProps} />
            default:
              return (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <p className="text-sm text-gray-600">Initializing map...</p>
                </div>
              )
          }
        }}
      />
    </div>
  )
}