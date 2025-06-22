import { MapPinIcon } from '@heroicons/react/24/outline'

interface MapPlaceholderProps {
  height?: string
  showMessage?: boolean
}

export default function MapPlaceholder({ 
  height = 'h-96', 
  showMessage = true 
}: MapPlaceholderProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${height} flex items-center justify-center`}>
      {showMessage ? (
        <div className="text-center p-6">
          <MapPinIcon className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Interactive Map</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm">
            Google Maps integration will display parking locations, routes, and real-time availability here
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>Available</span>
              <div className="h-2 w-2 bg-red-500 rounded-full ml-4"></div>
              <span>Occupied</span>
              <div className="h-2 w-2 bg-yellow-500 rounded-full ml-4"></div>
              <span>Reserved</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <MapPinIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Map loading...</p>
        </div>
      )}
    </div>
  )
}