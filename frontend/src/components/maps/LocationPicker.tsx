import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline'
import GoogleMap from './GoogleMap'
import { GeocodingService } from '../../services/maps'

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void
  initialLocation?: { lat: number; lng: number }
  height?: string
}

export default function LocationPicker({
  onLocationSelect,
  initialLocation,
  height = 'h-64'
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Initialize with initial location
  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation({
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        address: 'Selected location'
      })
    }
  }, [initialLocation])

  // Search for location
  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const result = await GeocodingService.geocodeAddress(query)
      if (result) {
        setSelectedLocation({
          lat: result.lat,
          lng: result.lng,
          address: result.formattedAddress
        })
        
        onLocationSelect({
          lat: result.lat,
          lng: result.lng
        })
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle map click
  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return

    const lat = event.latLng.lat()
    const lng = event.latLng.lng()

    setSelectedLocation({ lat, lng, address: 'Selected location' })

    // Reverse geocode to get address
    try {
      const address = await GeocodingService.reverseGeocode(lat, lng)
      if (address) {
        setSearchQuery(address)
        setSelectedLocation(prev => prev ? { ...prev, address } : null)
        
        onLocationSelect({
          lat,
          lng
        })
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  // Handle search button click
  const handleSearchClick = () => {
    handleSearch(searchQuery)
  }

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch(searchQuery)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Search for location
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter address, neighborhood, or landmark..."
            className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={isSearching || !searchQuery.trim()}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            ) : (
              <span className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Search
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Click on the map to select exact location
        </label>
        <GoogleMap
          center={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : undefined}
          zoom={selectedLocation ? 16 : 12}
          height={height}
          onMapClick={handleMapClick}
          markers={selectedLocation ? [{
            id: 1,
            title: 'Selected Location',
            location: {
              address: selectedLocation.address,
              latitude: selectedLocation.lat,
              longitude: selectedLocation.lng,
              borough: '',
              zipCode: ''
            },
            pricing: { hourly_rate: 0 },
            status: 'available' as const,
            // Add other required fields with default values
            description: '',
            parking_type: 'street' as any,
            vehicle_types: [],
            amenities: {},
            availability: {},
            is_instant_book: false,
            owner: 1,
            images: [],
            rating: 0,
            review_count: 0,
            created_at: '',
            updated_at: ''
          }] : []}
          showControls={false}
        />
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start">
            <MapPinIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Selected Location</p>
              <p className="text-sm text-blue-700">{selectedLocation.address}</p>
              <p className="text-xs text-blue-600 mt-1">
                Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Search for your address first, then click on the map to fine-tune the exact location of your parking space.
        </p>
      </div>
    </div>
  )
}