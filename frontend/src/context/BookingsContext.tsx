import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface Booking {
  id: number;
  booking_id: string;
  parking_space: any;
  start_time: string;
  end_time: string;
  vehicle_license_plate: string;
  vehicle_make_model: string;
  special_instructions: string;
  status: string;
  total_amount: number;
  created_at: string;
  user: number;
  user_name: string;
  user_email: string;
}

interface BookingsContextType {
  bookings: Booking[];
  loading: boolean;
  refreshBookings: () => Promise<void>;
  getBookingById: (id: number) => Booking | undefined;
}

const BookingsContext = createContext<BookingsContextType>({
  bookings: [],
  loading: true,
  refreshBookings: async () => {},
  getBookingById: () => undefined,
});

export const useBookings = () => {
  const context = useContext(BookingsContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingsProvider');
  }
  return context;
};

interface BookingsProviderProps {
  children: ReactNode;
}

export const BookingsProvider: React.FC<BookingsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingPromise, setLoadingPromise] = useState<Promise<void> | null>(null);

  const loadBookings = async () => {
    if (!user || dataLoaded) return;
    
    // If already loading, return the existing promise
    if (loadingPromise) return loadingPromise;
    
    const promise = (async () => {
      setLoading(true);
      try {
        console.log('BookingsContext: Loading bookings for user', user.id);
        const response = await api.get('/bookings/bookings/');
        const bookingsData = response.data.results || response.data || [];
        console.log('BookingsContext: Loaded', bookingsData.length, 'bookings');
        
        // SECURITY FIX: Validate that all bookings belong to the current user
        const validBookings = bookingsData.filter((booking: Booking) => {
          if (booking.user !== user.id) {
            console.error('BookingsContext: SECURITY ISSUE - Booking', booking.id, 'belongs to user', booking.user, 'but current user is', user.id);
            return false;
          }
          return true;
        });
        
        if (validBookings.length !== bookingsData.length) {
          console.error('BookingsContext: SECURITY ALERT - Filtered out', bookingsData.length - validBookings.length, 'bookings that belonged to other users');
        }
        
        setBookings(validBookings);
        setDataLoaded(true);
      } catch (error) {
        console.error('BookingsContext: Error loading bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
        setLoadingPromise(null);
      }
    })();
    
    setLoadingPromise(promise);
    return promise;
  };

  const refreshBookings = async () => {
    if (!user) {
      console.warn('BookingsContext: Cannot refresh bookings - no user authenticated');
      return;
    }
    console.log('BookingsContext: Refreshing bookings for user', user.id);
    setDataLoaded(false);
    await loadBookings();
  };

  const getBookingById = (id: number) => {
    const booking = bookings.find(booking => booking.id === id);
    
    // Additional security check
    if (booking && user && booking.user !== user.id) {
      console.error('BookingsContext: SECURITY ISSUE - Attempted to access booking', id, 'belonging to user', booking.user, 'but current user is', user.id);
      return undefined;
    }
    
    return booking;
  };

  useEffect(() => {
    if (user && !dataLoaded) {
      loadBookings();
    }
  }, [user?.id, dataLoaded]);

  // Reset dataLoaded when user changes - SECURITY CRITICAL: Prevents data leakage between users
  useEffect(() => {
    console.log('BookingsContext: User changed, clearing bookings data for security');
    setDataLoaded(false);
    setBookings([]);
  }, [user?.id]);

  const value: BookingsContextType = {
    bookings,
    loading,
    refreshBookings,
    getBookingById,
  };

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
};