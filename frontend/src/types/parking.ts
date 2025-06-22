// Parking listing types and interfaces

export type ParkingType = 'garage' | 'driveway' | 'lot' | 'street' | 'covered'
export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'suv' | 'van'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Location {
  latitude: number
  longitude: number
  address: string
  borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island'
  zipCode: string
  neighborhood?: string
}

export interface Amenities {
  covered: boolean
  security: boolean
  lighting: boolean
  cctv: boolean
  gated: boolean
  electric_charging: boolean
  handicap_accessible: boolean
  valet: boolean
  car_wash: boolean
  height_clearance?: number // in feet
}

export interface Pricing {
  hourly_rate: number
  daily_rate?: number
  weekly_rate?: number
  monthly_rate?: number
  minimum_hours?: number
}

export interface Availability {
  monday: { start: string; end: string; available: boolean }
  tuesday: { start: string; end: string; available: boolean }
  wednesday: { start: string; end: string; available: boolean }
  thursday: { start: string; end: string; available: boolean }
  friday: { start: string; end: string; available: boolean }
  saturday: { start: string; end: string; available: boolean }
  sunday: { start: string; end: string; available: boolean }
  blackout_dates?: string[] // ISO date strings
}

export interface ParkingListing {
  id: number
  title: string
  description: string
  parking_type: ParkingType
  vehicle_types: VehicleType[]
  location: Location
  amenities: Amenities
  pricing: Pricing
  availability: Availability
  images: string[]
  host_id: number
  host_name: string
  host_avatar?: string
  rating: number
  reviews_count: number
  is_active: boolean
  is_instant_book: boolean
  created_at: string
  updated_at: string
}

export interface SearchFilters {
  borough?: string
  parking_type?: ParkingType[]
  vehicle_type?: VehicleType
  min_price?: number
  max_price?: number
  amenities?: (keyof Amenities)[]
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  instant_book_only?: boolean
  available_now?: boolean
  available_today?: boolean
  available_this_week?: boolean
  wheelchair_accessible?: boolean
  min_rating?: number
  max_distance?: number
  sort_by?: 'price' | 'distance' | 'rating' | 'newest'
}

export interface BookingRequest {
  listing_id: number
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  vehicle_type: VehicleType
  total_hours: number
  total_amount: number
  message?: string
}

export interface Booking {
  id: number
  listing: ParkingListing
  renter_id: number
  renter_name: string
  renter_email: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  vehicle_type: VehicleType
  license_plate?: string
  total_hours: number
  total_amount: number
  status: BookingStatus
  payment_status: 'pending' | 'paid' | 'refunded'
  created_at: string
  updated_at: string
  special_instructions?: string
}

export interface CreateListingData {
  title: string
  description: string
  parking_type: ParkingType
  vehicle_types: VehicleType[]
  location: {
    address: string
    latitude: number
    longitude: number
    borough: string
    zipCode: string
    neighborhood?: string
  }
  amenities: Partial<Amenities>
  pricing: Pricing
  availability: Availability
  images?: File[]
  is_instant_book: boolean
}

// API Response types
export interface ListingsResponse {
  results: ParkingListing[]
  count: number
  next?: string
  previous?: string
}

export interface BookingsResponse {
  results: Booking[]
  count: number
  next?: string
  previous?: string
}

// Map-related types
export interface MapMarker {
  id: number
  position: {
    lat: number
    lng: number
  }
  title: string
  price: number
  parking_type: ParkingType
  available: boolean
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

// NYC Boroughs with coordinates for map
export const NYC_BOROUGHS = {
  Manhattan: { lat: 40.7831, lng: -73.9712 },
  Brooklyn: { lat: 40.6782, lng: -73.9442 },
  Queens: { lat: 40.7282, lng: -73.7949 },
  Bronx: { lat: 40.8448, lng: -73.8648 },
  'Staten Island': { lat: 40.5795, lng: -74.1502 },
} as const

// Default NYC center for map
export const NYC_CENTER = { lat: 40.7505, lng: -73.9934 }

// Parking type options for forms
export const PARKING_TYPE_OPTIONS: { value: ParkingType; label: string; icon: string }[] = [
  { value: 'garage', label: 'Garage', icon: '🏢' },
  { value: 'street', label: 'Street parking', icon: '🛣️' },
  { value: 'lot', label: 'Parking lot', icon: '🅿️' },
  { value: 'covered', label: 'Covered space', icon: '🏗️' },
  { value: 'driveway', label: 'Driveway', icon: '🏠' },
]

// Vehicle type options
export const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'suv', label: 'SUV', icon: '🚙' },
  { value: 'truck', label: 'Truck', icon: '🚚' },
  { value: 'van', label: 'Van', icon: '🚐' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
]

// Borough options
export const BOROUGH_OPTIONS = [
  { value: 'Manhattan', label: 'Manhattan' },
  { value: 'Brooklyn', label: 'Brooklyn' },
  { value: 'Queens', label: 'Queens' },
  { value: 'Bronx', label: 'Bronx' },
  { value: 'Staten Island', label: 'Staten Island' },
]