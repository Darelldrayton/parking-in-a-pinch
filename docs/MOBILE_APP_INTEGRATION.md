# Mobile App Integration Documentation

## Table of Contents
1. [Mobile Strategy Overview](#mobile-strategy-overview)
2. [Progressive Web App (PWA)](#progressive-web-app-pwa)
3. [Mobile-Responsive Design](#mobile-responsive-design)
4. [Mobile-Specific Features](#mobile-specific-features)
5. [Performance Optimization](#performance-optimization)
6. [Platform-Specific Considerations](#platform-specific-considerations)
7. [Future Native App Strategy](#future-native-app-strategy)
8. [Testing and Quality Assurance](#testing-and-quality-assurance)

## Mobile Strategy Overview

### Phase 1: Progressive Web App (PWA)
The initial mobile strategy focuses on delivering a high-quality Progressive Web App that provides native-like functionality through web technologies.

**Benefits:**
- Single codebase for web and mobile
- Instant deployment and updates
- No app store approval process
- Lower development and maintenance costs
- Cross-platform compatibility

**Limitations:**
- Limited access to some native APIs
- iOS Safari restrictions on PWA features
- Performance may not match native apps
- Discovery through app stores requires additional effort

### Phase 2: Native App Development (Future)
Based on user feedback and business requirements, native apps may be developed using React Native or platform-specific technologies.

## Progressive Web App (PWA)

### PWA Configuration

#### Manifest File
```json
// public/manifest.json
{
  "name": "Parking in a Pinch",
  "short_name": "ParkingPinch",
  "description": "Find and book parking spots instantly",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "orientation": "portrait-primary",
  "categories": ["travel", "navigation", "utilities"],
  "lang": "en-US",
  "dir": "ltr",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Search Parking",
      "short_name": "Search",
      "description": "Find parking spots near you",
      "url": "/search",
      "icons": [
        {
          "src": "/icons/search-shortcut.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "My Bookings",
      "short_name": "Bookings",
      "description": "View your current bookings",
      "url": "/bookings",
      "icons": [
        {
          "src": "/icons/bookings-shortcut.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Add Parking Spot",
      "short_name": "Add Spot",
      "description": "List your parking spot",
      "url": "/listings/new",
      "icons": [
        {
          "src": "/icons/add-shortcut.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

#### Service Worker Implementation
```typescript
// public/sw.js
const CACHE_NAME = 'parking-pinch-v1.0.0'
const STATIC_CACHE = 'static-cache-v1.0.0'
const DYNAMIC_CACHE = 'dynamic-cache-v1.0.0'
const IMAGE_CACHE = 'image-cache-v1.0.0'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
  }
  // Images - cache first
  else if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
  }
  // Static assets - cache first
  else if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  }
  // Other requests - stale while revalidate
  else {
    event.respondWith(staleWhileRevalidate(request))
  }
})

// Caching strategies
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(DYNAMIC_CACHE)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline')
  }
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) return cachedResponse

  try {
    const response = await fetch(request)
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    return new Response('Offline')
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone())
    return response
  })

  return cachedResponse || fetchPromise
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    data: event.data.json(),
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Parking in a Pinch', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
})
```

### Push Notifications
```typescript
// src/services/pushNotifications.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

class PushNotificationService {
  private messaging: any
  private vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

  async initialize() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      this.messaging = getMessaging()
      await this.requestPermission()
      this.setupMessageListener()
    }
  }

  async requestPermission(): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: this.vapidKey
        })
        
        // Send token to backend
        await this.sendTokenToServer(token)
        return token
      }
      
      return null
    } catch (error) {
      console.error('Failed to get push token:', error)
      return null
    }
  }

  private setupMessageListener() {
    onMessage(this.messaging, (payload) => {
      const { title, body, data } = payload.notification
      
      // Show notification if app is in foreground
      if (document.visibilityState === 'visible') {
        this.showInAppNotification(title, body, data)
      }
    })
  }

  private async sendTokenToServer(token: string) {
    await fetch('/api/v1/notifications/push-token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ token })
    })
  }

  private showInAppNotification(title: string, body: string, data: any) {
    // Custom in-app notification UI
    // Could use a toast library or custom component
  }
}

export const pushNotificationService = new PushNotificationService()
```

## Mobile-Responsive Design

### Responsive Breakpoints
```typescript
// src/styles/breakpoints.ts
export const breakpoints = {
  xs: '0px',      // Extra small devices (phones, 0px and up)
  sm: '576px',    // Small devices (landscape phones, 576px and up)
  md: '768px',    // Medium devices (tablets, 768px and up)
  lg: '992px',    // Large devices (desktops, 992px and up)
  xl: '1200px',   // Extra large devices (large desktops, 1200px and up)
  xxl: '1400px'   // Extra extra large devices (larger desktops, 1400px and up)
}

export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.md})`,
  tablet: `(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  desktop: `(min-width: ${breakpoints.lg})`,
  touch: '(hover: none) and (pointer: coarse)'
}
```

### Touch-Optimized Components
```typescript
// src/components/TouchOptimized/Button.tsx
interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}) => {
  const buttonClasses = cn(
    // Base styles
    'relative inline-flex items-center justify-center font-medium',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    
    // Touch-friendly minimum size (44px)
    'min-h-[44px] min-w-[44px]',
    
    // Size variants
    {
      'px-3 py-2 text-sm': size === 'sm',
      'px-4 py-3 text-base': size === 'md',
      'px-6 py-4 text-lg': size === 'lg',
    },
    
    // Variant styles
    {
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500': variant === 'primary',
      'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary',
      'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500': variant === 'ghost',
    },
    
    // Full width
    fullWidth && 'w-full',
    
    className
  )

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  )
}
```

### Mobile Navigation
```typescript
// src/components/Navigation/MobileNav.tsx
export const MobileNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 md:hidden">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Parking in a Pinch" className="h-8" />
          </Link>
          
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900"
            aria-label="Open menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <Transition show={isMenuOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 md:hidden"
          onClose={setIsMenuOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl">
              <div className="h-full flex flex-col">
                {/* Menu Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-4 py-6 space-y-4">
                  <MobileNavLink to="/search" icon={SearchIcon}>
                    Find Parking
                  </MobileNavLink>
                  
                  {user ? (
                    <>
                      <MobileNavLink to="/bookings" icon={CalendarIcon}>
                        My Bookings
                      </MobileNavLink>
                      <MobileNavLink to="/listings" icon={LocationMarkerIcon}>
                        My Listings
                      </MobileNavLink>
                      <MobileNavLink to="/messages" icon={ChatIcon}>
                        Messages
                      </MobileNavLink>
                      <MobileNavLink to="/profile" icon={UserIcon}>
                        Profile
                      </MobileNavLink>
                    </>
                  ) : (
                    <>
                      <MobileNavLink to="/login" icon={LoginIcon}>
                        Login
                      </MobileNavLink>
                      <MobileNavLink to="/register" icon={UserAddIcon}>
                        Sign Up
                      </MobileNavLink>
                    </>
                  )}
                </nav>
              </div>
            </div>
          </Transition.Child>
        </Dialog>
      </Transition>

      {/* Bottom Tab Bar */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
          <div className="grid grid-cols-4 h-16">
            <TabBarItem to="/" icon={HomeIcon} label="Home" />
            <TabBarItem to="/search" icon={SearchIcon} label="Search" />
            <TabBarItem to="/bookings" icon={CalendarIcon} label="Bookings" />
            <TabBarItem to="/profile" icon={UserIcon} label="Profile" />
          </div>
        </nav>
      )}
    </>
  )
}
```

## Mobile-Specific Features

### Geolocation Integration
```typescript
// src/hooks/useGeolocation.ts
interface GeolocationState {
  position: GeolocationPosition | null
  error: GeolocationPositionError | null
  loading: boolean
}

export const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false
  })

  const getCurrentPosition = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: new Error('Geolocation not supported') as any,
        loading: false
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
          ...options
        })
      })

      setState({
        position,
        error: null,
        loading: false
      })
    } catch (error) {
      setState({
        position: null,
        error: error as GeolocationPositionError,
        loading: false
      })
    }
  }, [options])

  return {
    ...state,
    getCurrentPosition
  }
}
```

### Camera Integration
```typescript
// src/components/Camera/CameraCapture.tsx
interface CameraCaptureProps {
  onCapture: (file: File) => void
  onError?: (error: string) => void
  maxFileSize?: number // in bytes
  acceptedFormats?: string[]
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onError,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSupported] = useState(() => 
    'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
  )

  const handleFileCapture = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxFileSize) {
      onError?.(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`)
      return
    }

    // Validate file format
    if (!acceptedFormats.includes(file.type)) {
      onError?.(`Please select a valid image format: ${acceptedFormats.join(', ')}`)
      return
    }

    onCapture(file)
  }, [onCapture, onError, maxFileSize, acceptedFormats])

  const openCamera = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        capture="environment" // Use rear camera by default
        onChange={handleFileCapture}
        className="hidden"
      />
      
      <TouchButton
        onClick={openCamera}
        variant="secondary"
        className="w-full"
        disabled={!isSupported}
      >
        <CameraIcon className="w-5 h-5 mr-2" />
        {isSupported ? 'Take Photo' : 'Camera Not Available'}
      </TouchButton>
    </>
  )
}
```

### QR Code Scanner
```typescript
// src/components/QRScanner/QRScanner.tsx
import { Html5QrcodeScanner } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null)

  const startScanning = useCallback(() => {
    if (!scannerRef.current) return

    const qrScanner = new Html5QrcodeScanner(
      scannerRef.current.id,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: ['QR_CODE']
      },
      false
    )

    qrScanner.render(
      (decodedText) => {
        qrScanner.clear()
        setIsScanning(false)
        onScan(decodedText)
      },
      (errorMessage) => {
        if (errorMessage.includes('No QR code found')) {
          return // Ignore this common error
        }
        onError?.(errorMessage)
      }
    )

    setScanner(qrScanner)
    setIsScanning(true)
  }, [onScan, onError])

  const stopScanning = useCallback(() => {
    if (scanner) {
      scanner.clear()
      setScanner(null)
      setIsScanning(false)
    }
  }, [scanner])

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear()
      }
    }
  }, [scanner])

  return (
    <div className="space-y-4">
      <div
        ref={scannerRef}
        id="qr-scanner"
        className={cn(
          'w-full aspect-square rounded-lg overflow-hidden',
          !isScanning && 'hidden'
        )}
      />
      
      {!isScanning ? (
        <TouchButton onClick={startScanning} className="w-full">
          <QrcodeIcon className="w-5 h-5 mr-2" />
          Start QR Scanner
        </TouchButton>
      ) : (
        <TouchButton onClick={stopScanning} variant="secondary" className="w-full">
          Stop Scanning
        </TouchButton>
      )}
    </div>
  )
}
```

## Performance Optimization

### Image Optimization
```typescript
// src/components/OptimizedImage/OptimizedImage.tsx
interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  sizes = '100vw',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  // Generate responsive image URLs
  const generateSrcSet = useCallback((baseSrc: string) => {
    const widths = [320, 640, 768, 1024, 1280, 1536]
    return widths
      .map(width => `${baseSrc}?w=${width}&q=75 ${width}w`)
      .join(', ')
  }, [])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setError(true)
  }, [])

  if (error) {
    return (
      <div className={cn('bg-gray-200 flex items-center justify-center', className)}>
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        src={src}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        {...props}
      />

      {/* Loading spinner */}
      {!isLoaded && placeholder === 'empty' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )}
    </div>
  )
}
```

### Lazy Loading Implementation
```typescript
// src/hooks/useIntersectionObserver.ts
export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false
  }: IntersectionObserverInit & { freezeOnceVisible?: boolean } = {}
) => {
  const [entry, setEntry] = useState<IntersectionObserverEntry>()

  const frozen = entry?.isIntersecting && freezeOnceVisible

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    setEntry(entry)
  }

  useEffect(() => {
    const node = elementRef?.current
    const hasIOSupport = !!window.IntersectionObserver

    if (!hasIOSupport || frozen || !node) return

    const observerParams = { threshold, root, rootMargin }
    const observer = new IntersectionObserver(updateEntry, observerParams)

    observer.observe(node)

    return () => observer.disconnect()
  }, [elementRef, threshold, root, rootMargin, frozen])

  return entry
}

// src/components/LazyLoad/LazyLoad.tsx
interface LazyLoadProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  rootMargin?: string
  threshold?: number
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  placeholder,
  rootMargin = '50px',
  threshold = 0
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const entry = useIntersectionObserver(ref, {
    rootMargin,
    threshold,
    freezeOnceVisible: true
  })

  const isVisible = !!entry?.isIntersecting

  return (
    <div ref={ref}>
      {isVisible ? children : placeholder}
    </div>
  )
}
```

## Platform-Specific Considerations

### iOS Safari Optimizations
```typescript
// src/utils/iosOptimizations.ts
export const iosOptimizations = {
  // Fix viewport height issues
  setViewportHeight: () => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    
    setVh()
    window.addEventListener('resize', setVh)
    window.addEventListener('orientationchange', setVh)
  },

  // Prevent zoom on input focus
  preventZoomOnInput: () => {
    const addViewportMeta = () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        )
      }
    }

    // Add listener for input focus
    document.addEventListener('focusin', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        addViewportMeta()
      }
    })

    // Reset on blur
    document.addEventListener('focusout', () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1'
        )
      }
    })
  },

  // Handle safe area insets
  handleSafeArea: () => {
    const supportsCSS = window.CSS && window.CSS.supports
    const supportsEnv = supportsCSS && window.CSS.supports('top: env(safe-area-inset-top)')
    
    if (supportsEnv) {
      document.documentElement.classList.add('supports-safe-area')
    }
  }
}
```

### Android Chrome Optimizations
```typescript
// src/utils/androidOptimizations.ts
export const androidOptimizations = {
  // Handle keyboard resize
  handleKeyboardResize: () => {
    let initialViewportHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDifference = initialViewportHeight - currentHeight
      
      // Keyboard is likely open if height decreased significantly
      if (heightDifference > 150) {
        document.body.classList.add('keyboard-open')
        document.documentElement.style.setProperty('--keyboard-height', `${heightDifference}px`)
      } else {
        document.body.classList.remove('keyboard-open')
        document.documentElement.style.setProperty('--keyboard-height', '0px')
      }
    }

    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  },

  // Optimize touch interactions
  optimizeTouchInteractions: () => {
    // Remove 300ms click delay
    document.addEventListener('touchstart', () => {}, { passive: true })
    
    // Improve scroll performance
    const scrollElements = document.querySelectorAll('[data-scroll]')
    scrollElements.forEach(element => {
      element.addEventListener('touchstart', () => {}, { passive: true })
      element.addEventListener('touchmove', () => {}, { passive: true })
    })
  }
}
```

## Future Native App Strategy

### React Native Migration Path
```typescript
// Phase 1: Code Preparation
// - Extract business logic into shared hooks
// - Create platform-agnostic components
// - Implement proper separation of concerns

// Phase 2: Native Shell
// - Create React Native shell app
// - Implement native navigation
// - Add platform-specific features

// Phase 3: Feature Parity
// - Migrate core features to native
// - Implement platform-specific optimizations
// - Add native-only features (widgets, deep linking)

// Shared business logic example
// src/shared/hooks/useBooking.ts
export const useBooking = () => {
  // Platform-agnostic booking logic
  // Can be used in both web and React Native
}

// Platform-specific implementations
// src/native/components/MapView.native.tsx (React Native)
// src/web/components/MapView.web.tsx (Web)
```

### Native Feature Roadmap
1. **Core Features**
   - Native navigation and animations
   - Enhanced camera integration
   - Offline mode with local storage
   - Push notifications with action buttons

2. **Platform-Specific Features**
   - iOS: Widgets, Shortcuts app integration, CarPlay
   - Android: Widgets, Android Auto, Tasker integration

3. **Performance Optimizations**
   - Native image caching
   - Background location updates
   - Native database (SQLite)
   - Optimized animations (60fps)

## Testing and Quality Assurance

### Mobile Testing Strategy
```typescript
// jest.config.mobile.js
module.exports = {
  preset: '@testing-library/jest-dom',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.mobile.ts'],
  testMatch: ['**/__tests__/**/*.mobile.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/test/**/*'
  ]
}

// src/test/setup.mobile.ts
import '@testing-library/jest-dom'

// Mock mobile-specific APIs
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    geolocation: {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn()
    },
    mediaDevices: {
      getUserMedia: jest.fn()
    }
  }
})

// Mock intersection observer
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock service worker
Object.defineProperty(window, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve()),
    unregister: jest.fn(() => Promise.resolve())
  }
})
```

### Browser Testing Matrix
- **Chrome Mobile** (Android)
- **Safari Mobile** (iOS)
- **Samsung Internet** (Android)
- **Firefox Mobile** (Android)
- **Edge Mobile** (iOS/Android)

### Performance Testing
```bash
# Lighthouse CI for mobile performance
npm install -g @lhci/cli

# Run mobile performance tests
lhci autorun --collect.settings.chromeFlags="--enable-features=VirtualKeyboard"
```

### Device Testing Checklist
- [ ] iPhone SE (smallest screen)
- [ ] iPhone 14 Pro (notch handling)
- [ ] Samsung Galaxy S21 (Android optimization)
- [ ] iPad (tablet experience)
- [ ] Pixel 6 (Android 12+ features)
- [ ] Various screen orientations
- [ ] Different network conditions (3G, 4G, WiFi)
- [ ] Battery optimization impact