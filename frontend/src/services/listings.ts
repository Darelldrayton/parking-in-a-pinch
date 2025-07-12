import api from './api'
import type {
  ParkingListing,
  Booking,
  BookingRequest,
  CreateListingData,
  SearchFilters,
  ListingsResponse,
  BookingsResponse,
  MapMarker,
  MapBounds,
} from '../types/parking'

// Parking Listings API Service
export const listingsService = {
  // Get all parking listings with optional filters
  async getListings(filters?: SearchFilters): Promise<ListingsResponse> {
    const params = new URLSearchParams()
    
    // If there's a search query, use it as the primary filter
    if (filters?.search) {
      params.append('search', filters.search)
      // Don't include borough when searching - it's already included in the search
    } else {
      // Only include other filters when not searching
      if (filters?.borough) params.append('borough', filters.borough)
      if (filters?.parking_type?.length) {
        filters.parking_type.forEach(type => params.append('space_type', type))
      }
      if (filters?.vehicle_type) params.append('max_vehicle_size', filters.vehicle_type)
      
      // Price filters
      if (filters?.min_price) params.append('min_price', filters.min_price.toString())
      if (filters?.max_price) params.append('max_price', filters.max_price.toString())
      
      // Amenities filter - send as comma-separated string
      if (filters?.amenities?.length) {
        params.append('amenities', filters.amenities.join(','))
      }
      
      // Individual amenity filters for more precise control
      if (filters?.amenities?.includes('covered')) params.append('is_covered', 'true')
      if (filters?.amenities?.includes('security')) params.append('has_security', 'true')
      if (filters?.amenities?.includes('electric_charging')) params.append('has_ev_charging', 'true')
      if (filters?.amenities?.includes('cctv')) params.append('has_cctv', 'true')
      if (filters?.amenities?.includes('car_wash')) params.append('has_car_wash', 'true')
      
      // Availability filters
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.start_time) params.append('start_time', filters.start_time)
      if (filters?.end_time) params.append('end_time', filters.end_time)
      
      // Special filters
      if (filters?.instant_book_only) params.append('instant_book', 'true')
      if (filters?.available_now) params.append('available_now', 'true')
      if (filters?.available_today) params.append('available_today', 'true')
      if (filters?.available_this_week) params.append('available_this_week', 'true')
      if (filters?.wheelchair_accessible) params.append('wheelchair_accessible', 'true')
      if (filters?.min_rating) params.append('min_rating', filters.min_rating.toString())
    }

    const queryString = params.toString()
    const url = `/listings/${queryString ? `?${queryString}` : ''}`
    
    const response = await api.get<ListingsResponse>(url)
    return response.data
  },

  // Get a single parking listing by ID
  async getListing(id: number): Promise<ParkingListing> {
    const response = await api.get<ParkingListing>(`/listings/${id}/`)
    return response.data
  },

  // Create a new parking listing
  async createListing(data: CreateListingData): Promise<ParkingListing> {
    const formData = new FormData()
    
    // Add text fields
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('parking_type', data.parking_type)
    formData.append('is_instant_book', data.is_instant_book.toString())
    
    // Add vehicle types as JSON
    formData.append('vehicle_types', JSON.stringify(data.vehicle_types))
    
    // Add location data as JSON
    formData.append('location', JSON.stringify(data.location))
    
    // Add amenities as JSON
    formData.append('amenities', JSON.stringify(data.amenities))
    
    // Add pricing as JSON
    formData.append('pricing', JSON.stringify(data.pricing))
    
    // Add availability as JSON
    formData.append('availability', JSON.stringify(data.availability))
    
    // Add images if provided
    if (data.images?.length) {
      data.images.forEach((image) => {
        formData.append(`images`, image)
      })
    }

    const response = await api.post<ParkingListing>('/listings/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Update an existing parking listing
  async updateListing(id: number, data: Partial<CreateListingData>): Promise<ParkingListing> {
    const formData = new FormData()
    
    // Add fields that are being updated
    if (data.title) formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.parking_type) formData.append('parking_type', data.parking_type)
    if (data.is_instant_book !== undefined) formData.append('is_instant_book', data.is_instant_book.toString())
    
    if (data.vehicle_types) formData.append('vehicle_types', JSON.stringify(data.vehicle_types))
    if (data.location) formData.append('location', JSON.stringify(data.location))
    if (data.amenities) formData.append('amenities', JSON.stringify(data.amenities))
    if (data.pricing) formData.append('pricing', JSON.stringify(data.pricing))
    if (data.availability) formData.append('availability', JSON.stringify(data.availability))
    
    if (data.images?.length) {
      data.images.forEach((image) => {
        formData.append(`images`, image)
      })
    }

    const response = await api.patch<ParkingListing>(`/listings/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete a parking listing
  async deleteListing(id: number): Promise<void> {
    await api.delete(`/listings/${id}/`)
  },

  // Toggle listing active status
  async toggleListingStatus(id: number): Promise<ParkingListing> {
    const response = await api.patch<ParkingListing>(`/listings/${id}/toggle-status/`)
    return response.data
  },

  // Get user's own listings
  async getMyListings(): Promise<ListingsResponse> {
    const response = await api.get<ListingsResponse>('/listings/my-listings/')
    return response.data
  },

  // Search listings by location (for map view)
  async searchByLocation(bounds: MapBounds): Promise<MapMarker[]> {
    const params = new URLSearchParams({
      north: bounds.north.toString(),
      south: bounds.south.toString(),
      east: bounds.east.toString(),
      west: bounds.west.toString(),
    })

    const response = await api.get<MapMarker[]>(`/listings/search-by-location/?${params}`)
    return response.data
  },

  // Get featured/popular listings
  async getFeaturedListings(): Promise<ParkingListing[]> {
    const response = await api.get<ParkingListing[]>('/listings/featured/')
    return response.data
  },

  // Get nearby listings based on coordinates
  async getNearbyListings(lat: number, lng: number, radius: number = 1): Promise<ParkingListing[]> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    })

    const response = await api.get<ParkingListing[]>(`/listings/nearby/?${params}`)
    return response.data
  },
}

// Booking API Service
export const bookingsService = {
  // Create a new booking request
  async createBooking(data: BookingRequest): Promise<Booking> {
    const response = await api.post<Booking>('/bookings/', data)
    return response.data
  },

  // Get user's bookings (as renter)
  async getMyBookings(): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/my-bookings/')
    return response.data
  },

  // Get bookings for user's listings (as host)
  async getMyListingBookings(): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/my-listing-bookings/')
    return response.data
  },

  // Get a specific booking by ID
  async getBooking(id: number): Promise<Booking> {
    const response = await api.get<Booking>(`/bookings/${id}/`)
    return response.data
  },

  // Update booking status (for hosts)
  async updateBookingStatus(id: number, status: 'confirmed' | 'cancelled'): Promise<Booking> {
    const response = await api.patch<Booking>(`/bookings/${id}/`, { status })
    return response.data
  },

  // Cancel a booking (for renters)
  async cancelBooking(id: number): Promise<Booking> {
    const response = await api.patch<Booking>(`/bookings/${id}/cancel/`)
    return response.data
  },

  // Check availability for a listing
  async checkAvailability(
    listingId: number,
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string
  ): Promise<{ available: boolean; conflicts?: string[] }> {
    // Create ISO datetime strings for the availability check
    const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
    const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();
    
    const requestData = {
      parking_space_id: listingId,
      start_time: startDateTime,
      end_time: endDateTime
    };

    try {
      const response = await api.post<{ available: boolean; conflicts?: string[] }>(
        '/bookings/bookings/check_availability/',
        requestData
      )
      return response.data
    } catch (error: any) {
      console.error('Error checking availability:', error);
      
      // Return false for availability if there's an error
      return {
        available: false,
        conflicts: ['Unable to check availability']
      };
    }
  },

  // Calculate booking price
  async calculatePrice(
    listingId: number,
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string
  ): Promise<{ total_hours: number; total_amount: number; breakdown: any }> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
    })

    const response = await api.get<{ total_hours: number; total_amount: number; breakdown: any }>(
      `/listings/${listingId}/calculate-price/?${params}`
    )
    return response.data
  },
}

// Utility functions for listings
export const listingsUtils = {
  // Format price for display
  formatPrice(price: number, period: 'hour' | 'day' | 'week' | 'month' = 'hour'): string {
    const periods = {
      hour: '/hr',
      day: '/day',
      week: '/week',
      month: '/month'
    }
    
    return `$${price}${periods[period]}`
  },

  // Calculate distance between two points
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Radius of the Earth in miles
    const dLat = this.deg2rad(lat2 - lat1)
    const dLng = this.deg2rad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance in miles
    return Math.round(distance * 10) / 10 // Round to 1 decimal place
  },

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  },

  // Check if listing is available during specified time
  isAvailableAt(listing: ParkingListing, date: Date, startTime: string, endTime: string): boolean {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()] as keyof typeof listing.availability
    const dayAvailability = listing.availability[dayName] as any
    
    if (!dayAvailability || typeof dayAvailability === 'object' && !dayAvailability.available) return false
    
    if (typeof dayAvailability === 'object') {
      // Check if time falls within available hours
      const start = this.timeToMinutes(startTime)
      const end = this.timeToMinutes(endTime)
      const availableStart = this.timeToMinutes(dayAvailability.start)
      const availableEnd = this.timeToMinutes(dayAvailability.end)
      
      return start >= availableStart && end <= availableEnd
    }
    
    return false
  },

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  },

  // Filter listings by amenities
  filterByAmenities(listings: ParkingListing[], requiredAmenities: string[]): ParkingListing[] {
    return listings.filter(listing => 
      requiredAmenities.every(amenity => 
        listing.amenities[amenity as keyof typeof listing.amenities] === true
      )
    )
  },

  // Sort listings by distance from a point
  sortByDistance(
    listings: ParkingListing[], 
    centerLat: number, 
    centerLng: number
  ): ParkingListing[] {
    return listings
      .map(listing => ({
        ...listing,
        distance: this.calculateDistance(
          centerLat,
          centerLng,
          listing.location.latitude,
          listing.location.longitude
        )
      }))
      .sort((a, b) => a.distance - b.distance)
  },

  // Generate listing summary for cards
  getListingSummary(listing: ParkingListing): string {
    const features = []
    
    if (listing.amenities.covered) features.push('Covered')
    if (listing.amenities.security) features.push('Secure')
    if (listing.amenities.electric_charging) features.push('EV Charging')
    if (listing.is_instant_book) features.push('Instant Book')
    
    return features.slice(0, 3).join(' • ')
  },

  // Check if listing supports vehicle type
  supportsVehicle(listing: ParkingListing, vehicleType: string): boolean {
    return listing.vehicle_types.includes(vehicleType as any)
  },
}

// Named exports for convenience
export const getListings = listingsService.getListings;
export const getListing = listingsService.getListing;
export const createListing = listingsService.createListing;
export const getMyListings = listingsService.getMyListings;

export default {
  listings: listingsService,
  bookings: bookingsService,
  utils: listingsUtils,
}