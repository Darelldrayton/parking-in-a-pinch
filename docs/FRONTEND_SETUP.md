# Frontend Setup & Structure Documentation

## Table of Contents
1. [Frontend Overview](#frontend-overview)
2. [Initial Setup](#initial-setup)
3. [Project Structure](#project-structure)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [Routing Strategy](#routing-strategy)
7. [API Integration](#api-integration)
8. [Styling Approach](#styling-approach)
9. [Mobile Responsiveness](#mobile-responsiveness)
10. [Performance Optimization](#performance-optimization)

## Frontend Overview

The Parking in a Pinch frontend is a modern React application built with Vite, designed to provide a seamless experience across web and mobile browsers. It implements a component-based architecture with a focus on performance, maintainability, and user experience.

### Key Technologies
- **React 18** with concurrent features
- **Vite** for lightning-fast development
- **TypeScript** for type safety
- **Tailwind CSS** for utility-first styling
- **React Query** for server state management
- **Redux Toolkit** for client state
- **React Router** for navigation

## Initial Setup

### Prerequisites
```bash
# Required versions
node >= 18.0.0
npm >= 9.0.0
```

### Create Vite Project
```bash
# Create new Vite project with React and TypeScript
npm create vite@latest frontend -- --template react-ts

# Navigate to project
cd frontend

# Install dependencies
npm install
```

### Essential Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0",
    "react-hook-form": "^7.48.0",
    "mapbox-gl": "^3.0.0",
    "date-fns": "^3.0.0",
    "@stripe/stripe-js": "^2.0.0",
    "@stripe/react-stripe-js": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'map-vendor': ['mapbox-gl'],
        }
      }
    }
  }
})
```

## Project Structure

### Directory Organization
```
frontend/src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── layout/          # Layout components
│   └── ui/              # UI primitives
├── features/            # Feature-based modules
│   ├── auth/           # Authentication
│   ├── listings/       # Parking listings
│   ├── bookings/       # Booking management
│   ├── payments/       # Payment processing
│   ├── messaging/      # User messaging
│   └── profile/        # User profiles
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API services
├── store/              # Redux store
├── utils/              # Utilities
├── types/              # TypeScript types
├── styles/             # Global styles
└── App.tsx            # Root component
```

### Feature Module Structure
```
features/listings/
├── components/         # Feature-specific components
│   ├── ListingCard.tsx
│   ├── ListingDetails.tsx
│   ├── ListingForm.tsx
│   └── ListingMap.tsx
├── hooks/             # Feature-specific hooks
│   ├── useListings.ts
│   └── useListingDetails.ts
├── services/          # API calls
│   └── listingsApi.ts
├── store/             # Redux slices
│   └── listingsSlice.ts
├── types/             # TypeScript types
│   └── listing.types.ts
└── index.ts          # Public exports
```

## Component Architecture

### Component Categories

#### 1. Page Components
```typescript
// pages/HomePage.tsx
import { Hero, SearchBar, FeaturedListings } from '@features/listings'
import { Layout } from '@components/layout'

export const HomePage: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <SearchBar />
      <FeaturedListings />
    </Layout>
  )
}
```

#### 2. Feature Components
```typescript
// features/listings/components/ListingCard.tsx
interface ListingCardProps {
  listing: Listing
  onBook?: (listing: Listing) => void
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onBook }) => {
  return (
    <div className="listing-card">
      {/* Component implementation */}
    </div>
  )
}
```

#### 3. Common Components
```typescript
// components/common/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  ...props 
}) => {
  return (
    <button className={cn(buttonStyles({ variant, size }))} {...props}>
      {loading ? <Spinner /> : children}
    </button>
  )
}
```

### Component Best Practices
1. Use TypeScript for all components
2. Implement proper prop validation
3. Keep components focused and single-purpose
4. Use composition over inheritance
5. Implement error boundaries
6. Memoize expensive computations
7. Use lazy loading for route components

## State Management

### Redux Store Configuration
```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@features/auth/store/authSlice'
import listingsReducer from '@features/listings/store/listingsSlice'
import bookingsReducer from '@features/bookings/store/bookingsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    listings: listingsReducer,
    bookings: bookingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### React Query Setup
```typescript
// services/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

### State Management Strategy
- **Redux**: Global app state (auth, user preferences, UI state)
- **React Query**: Server state (API data caching)
- **Component State**: Local UI state
- **Context API**: Theme, locale, feature flags

## Routing Strategy

### Route Configuration
```typescript
// routes/index.tsx
import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'

const HomePage = lazy(() => import('@pages/HomePage'))
const SearchPage = lazy(() => import('@pages/SearchPage'))
const ListingDetails = lazy(() => import('@pages/ListingDetails'))
const Dashboard = lazy(() => import('@pages/Dashboard'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'listing/:id', element: <ListingDetails /> },
      {
        path: 'dashboard',
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'listings', element: <MyListings /> },
          { path: 'bookings', element: <MyBookings /> },
          { path: 'messages', element: <Messages /> },
          { path: 'settings', element: <Settings /> },
        ]
      }
    ]
  }
])
```

### Protected Routes
```typescript
// components/ProtectedRoute.tsx
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return <Outlet />
}
```

## API Integration

### Axios Configuration
```typescript
// services/api.ts
import axios from 'axios'
import { store } from '@store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const state = store.getState()
    const token = state.auth.token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout())
    }
    return Promise.reject(error)
  }
)

export default api
```

### API Service Example
```typescript
// features/listings/services/listingsApi.ts
import api from '@services/api'
import { Listing, ListingFilters } from '../types'

export const listingsApi = {
  getListings: async (filters: ListingFilters) => {
    const { data } = await api.get<Listing[]>('/listings', { params: filters })
    return data
  },
  
  getListingById: async (id: string) => {
    const { data } = await api.get<Listing>(`/listings/${id}`)
    return data
  },
  
  createListing: async (listing: Partial<Listing>) => {
    const { data } = await api.post<Listing>('/listings', listing)
    return data
  },
  
  updateListing: async (id: string, updates: Partial<Listing>) => {
    const { data } = await api.patch<Listing>(`/listings/${id}`, updates)
    return data
  },
}
```

## Styling Approach

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7ec',
          500: '#22c55e',
          900: '#14532d',
        },
        secondary: {
          50: '#fef3c7',
          500: '#eab308',
          900: '#713f12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### Component Styling Pattern
```typescript
// Use cn utility for conditional classes
import { cn } from '@utils/cn'

<div className={cn(
  'base-styles',
  isActive && 'active-styles',
  isDisabled && 'disabled-styles'
)} />
```

## Mobile Responsiveness

### Responsive Design Principles
1. Mobile-first approach
2. Touch-friendly UI elements (min 44px touch targets)
3. Responsive images with srcset
4. Viewport meta tag configuration
5. PWA capabilities

### PWA Configuration
```json
// public/manifest.json
{
  "name": "Parking in a Pinch",
  "short_name": "ParkingPinch",
  "description": "NYC's Premier Parking Marketplace",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Registration
```typescript
// src/serviceWorkerRegistration.ts
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'))
    })
  }
}
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy components
const MapView = lazy(() => import('@components/MapView'))

// Use Suspense for loading states
<Suspense fallback={<MapSkeleton />}>
  <MapView />
</Suspense>
```

### Image Optimization
```typescript
// components/OptimizedImage.tsx
export const OptimizedImage: React.FC<ImageProps> = ({ src, alt, ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  )
}
```

### Performance Monitoring
```typescript
// utils/performance.ts
export const measurePerformance = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.time(componentName)
    return () => console.timeEnd(componentName)
  }
  return () => {}
}
```

### Bundle Optimization
1. Tree shaking with ES modules
2. Dynamic imports for route-based splitting
3. Optimize dependencies with manual chunks
4. Compress assets with gzip/brotli
5. Implement resource hints (preload, prefetch)
6. Use production builds with minification