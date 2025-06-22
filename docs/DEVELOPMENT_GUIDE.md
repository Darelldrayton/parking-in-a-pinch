# Parking in a Pinch - Complete Development Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [Backend Development (Django)](#backend-development-django)
6. [Frontend Development (React + Vite)](#frontend-development-react--vite)
7. [Deployment Strategy](#deployment-strategy)
8. [Development Timeline](#development-timeline)
9. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)

## Project Overview

Parking in a Pinch is a peer-to-peer parking marketplace for New York City, connecting parking space owners with drivers seeking parking. The platform serves two primary user types:

- **Hosts**: Property owners who rent out parking spaces
- **Renters**: Drivers who need temporary or recurring parking

### Key Features

- Dual user authentication and profiles
- Parking space listings with photos and availability
- Interactive map-based search (by NYC borough)
- Booking and payment system
- Review and rating system
- In-app messaging
- Mobile-responsive design + PWA capabilities

## Technology Stack

### Frontend

- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API / Redux Toolkit
- **Maps**: Google Maps API or Mapbox
- **HTTP Client**: Axios
- **Routing**: React Router Dom
- **Forms**: React Hook Form + Yup validation
- **UI Components**: Headless UI or Radix UI
- **Animations**: Framer Motion

### Backend

- **Framework**: Django 4.2+ with Django REST Framework
- **Authentication**: Django Allauth + JWT tokens
- **File Storage**: Django Storages + AWS S3 (or Cloudinary)
- **API Documentation**: Django REST Swagger/OpenAPI
- **Task Queue**: Celery + Redis (for notifications, emails)
- **Image Processing**: Pillow
- **Payments**: Stripe integration

### Database

- **Primary Database**: PostgreSQL 14+
- **Caching**: Redis
- **Search**: PostgreSQL full-text search (or Elasticsearch for advanced)

### DevOps & Deployment

- **Frontend Hosting**: Vercel (primary) or Netlify
- **Backend Hosting**: Railway, Render, or DigitalOcean
- **Database Hosting**: Railway PostgreSQL, AWS RDS, or DigitalOcean Managed DB
- **File Storage**: AWS S3 or Cloudinary
- **Monitoring**: Sentry for error tracking
- **Version Control**: Git + GitHub

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  React Web App (Vite)     │    Mobile PWA/React Native     │
│  - Tailwind CSS           │    - Same React codebase       │
│  - Google Maps            │    - PWA features              │
│  - Responsive design      │    - Push notifications        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                   HTTPS/API
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  API GATEWAY                               │
├─────────────────────────────────────────────────────────────┤
│               Django REST API                              │
│  - Authentication (JWT)    │    - File uploads             │
│  - User management         │    - Payment processing       │
│  - Listing CRUD            │    - Notifications            │
│  - Booking system          │    - Review system            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                 Database Layer
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  PostgreSQL DB      │  Redis Cache    │   External APIs     │
│  - User profiles    │  - Sessions     │   - Stripe         │
│  - Listings         │  - API cache    │   - Google Maps    │
│  - Bookings         │  - Task queue   │   - Email service  │
│  - Reviews          │                 │   - SMS service    │
└─────────────────────────────────────────────────────────────┘
```

## Database Design

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    profile_image_url TEXT,
    user_type VARCHAR(20) CHECK (user_type IN ('host', 'renter', 'both')),
    is_verified BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### User Profiles Table
```sql
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    drivers_license_url TEXT,
    insurance_url TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending',
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Parking Listings Table
```sql
CREATE TABLE parking_listings (
    id SERIAL PRIMARY KEY,
    host_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    borough VARCHAR(50) CHECK (borough IN ('Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island')),
    space_type VARCHAR(50) CHECK (space_type IN ('driveway', 'garage', 'lot', 'street')),
    hourly_rate DECIMAL(8,2),
    daily_rate DECIMAL(8,2),
    weekly_rate DECIMAL(8,2),
    is_covered BOOLEAN DEFAULT FALSE,
    has_ev_charging BOOLEAN DEFAULT FALSE,
    has_security BOOLEAN DEFAULT FALSE,
    max_vehicle_size VARCHAR(50),
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Listing Images Table
```sql
CREATE TABLE listing_images (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES parking_listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(200),
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Bookings Table
```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES parking_listings(id) ON DELETE CASCADE,
    renter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(20) CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    stripe_payment_intent_id VARCHAR(100),
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Reviews Table
```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_type VARCHAR(20) CHECK (review_type IN ('host_to_renter', 'renter_to_host')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    subject VARCHAR(200),
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Backend Development (Django)

### Project Structure
```
parking_backend/
├── manage.py
├── requirements.txt
├── .env
├── parking_project/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   ├── urls.py
│   ├── wsgi.py
├── apps/
│   ├── authentication/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   ├── listings/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   ├── bookings/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   ├── reviews/
│   ├── messaging/
│   ├── payments/
│   └── notifications/
├── static/
├── media/
└── templates/
```

### Key Django Apps

#### 1. Authentication App
- Custom User model extending AbstractUser
- JWT token authentication
- Social login integration (Google, Facebook)
- Email verification
- Password reset functionality

#### 2. Listings App
- Parking space CRUD operations
- Image upload handling
- Geolocation features
- Search and filtering
- Availability calendar

#### 3. Bookings App
- Booking creation and management
- Payment integration with Stripe
- Booking status updates
- Calendar conflict prevention

#### 4. Reviews App
- Two-way review system
- Rating calculations
- Review moderation

#### 5. Messaging App
- In-app messaging between users
- Real-time notifications
- Message threading

### Essential Django Packages
```
Django==4.2.7
djangorestframework==3.14.0
django-allauth==0.57.0
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.1
django-storages==1.14.2
Pillow==10.1.0
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
stripe==7.8.0
boto3==1.34.0
django-environ==0.11.2
drf-yasg==1.21.7
```

## Frontend Development (React + Vite)

### Project Structure
```
parking_frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── public/
│   ├── manifest.json
│   ├── icons/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   ├── ProfileForm.jsx
│   │   ├── listings/
│   │   │   ├── ListingCard.jsx
│   │   │   ├── ListingForm.jsx
│   │   │   ├── ListingDetails.jsx
│   │   │   ├── ListingSearch.jsx
│   │   ├── bookings/
│   │   │   ├── BookingForm.jsx
│   │   │   ├── BookingCard.jsx
│   │   ├── maps/
│   │   │   ├── MapView.jsx
│   │   │   ├── MarkerCluster.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Listings.jsx
│   │   ├── Profile.jsx
│   │   ├── Bookings.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   ├── useGeolocation.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── NotificationContext.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── stripe.js
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── constants.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── components.css
```

### Key Frontend Features

#### 1. Authentication System
- Login/Signup forms with validation
- JWT token management
- Protected routes
- User profile management

#### 2. Listing Management
- Create/edit parking space listings
- Photo upload with preview
- Interactive availability calendar
- Real-time preview

#### 3. Search & Discovery
- Map-based search interface
- Filter by borough, price, amenities
- List and grid view options
- Saved searches

#### 4. Booking System
- Date/time picker
- Payment integration (Stripe Elements)
- Booking confirmation
- Booking history

#### 5. Communication
- In-app messaging interface
- Real-time notifications
- Contact host functionality

### Essential Frontend Packages
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.18.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.47.0",
    "yup": "@hookform/resolvers": "^3.3.2",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.0.18",
    "framer-motion": "^10.16.5",
    "@stripe/stripe-js": "^2.1.11",
    "@stripe/react-stripe-js": "^2.4.0",
    "react-google-maps/api": "^2.19.2",
    "date-fns": "^2.30.0",
    "react-hot-toast": "^2.4.1",
    "zustand": "^4.4.6"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.1.1",
    "vite": "^4.5.0",
    "tailwindcss": "^3.3.5",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "eslint": "^8.53.0",
    "@typescript-eslint/eslint-plugin": "^6.10.0"
  }
}
```

## Deployment Strategy

### Development Environment
- **Backend**: Local Django server on port 8000
- **Frontend**: Vite dev server on port 5173
- **Database**: Local PostgreSQL or Docker container
- **Redis**: Local Redis server for caching/sessions

### Production Deployment

#### Frontend (Vercel)
- Automatic deployments from GitHub
- Environment variables for API endpoints
- Custom domain configuration
- PWA optimization

#### Backend (Railway/Render)
- Django app with gunicorn
- PostgreSQL database
- Redis for caching
- Environment variables for secrets
- Automatic deployments from GitHub

#### File Storage (AWS S3 or Cloudinary)
- User profile images
- Parking space photos
- Document uploads (licenses, insurance)

#### Third-party Services
- **Stripe**: Payment processing
- **Google Maps API**: Location and mapping
- **SendGrid**: Email notifications
- **Twilio**: SMS notifications

## Development Timeline

### Phase 1: Foundation (Weeks 1-2)
- Set up Django backend with basic models
- Create React frontend with routing
- Implement user authentication
- Set up database and basic API endpoints

### Phase 2: Core Features (Weeks 3-4)
- Listing creation and management
- Basic search functionality
- User profiles and verification
- Image upload system

### Phase 3: Booking System (Weeks 5-6)
- Booking creation and management
- Payment integration with Stripe
- Calendar and availability system
- Email notifications

### Phase 4: Enhanced Features (Weeks 7-8)
- Map integration and geolocation
- Review and rating system
- In-app messaging
- Advanced search filters

### Phase 5: Polish & Deploy (Weeks 9-10)
- Mobile responsiveness
- PWA features
- Performance optimization
- Production deployment
- Testing and bug fixes

## Step-by-Step Implementation Guide

### Step 1: Environment Setup

#### Backend Setup
```bash
# Create virtual environment
python -m venv parking_env
source parking_env/bin/activate  # Linux/Mac
# parking_env\Scripts\activate  # Windows

# Create Django project
pip install django djangorestframework
django-admin startproject parking_project
cd parking_project
python manage.py startapp authentication
python manage.py startapp listings
python manage.py startapp bookings
```

#### Frontend Setup
```bash
# Create React project with Vite
npm create vite@latest parking_frontend -- --template react
cd parking_frontend
npm install
npm install react-router-dom axios tailwindcss
```

### Step 2: Database Configuration

#### Django Settings
```python
# settings/base.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'parking_db',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'authentication',
    'listings',
    'bookings',
]
```

### Step 3: User Authentication

#### Custom User Model
```python
# authentication/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_TYPES = (
        ('host', 'Host'),
        ('renter', 'Renter'),
        ('both', 'Both'),
    )
    
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='renter')
    is_verified = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
```

### Step 4: API Development

#### Listing API Views
```python
# listings/views.py
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ParkingListing
from .serializers import ParkingListingSerializer

class ParkingListingViewSet(viewsets.ModelViewSet):
    serializer_class = ParkingListingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = ParkingListing.objects.filter(is_active=True)
        borough = self.request.query_params.get('borough')
        if borough:
            queryset = queryset.filter(borough=borough)
        return queryset
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        # Implement search logic
        pass
```

### Step 5: Frontend Implementation

#### React Router Setup
```jsx
// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
```

### Step 6: API Integration

#### API Service Setup
```javascript
// services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Step 7: Deployment Preparation

#### Environment Variables

**Backend (.env)**
```
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@host:port/db
STRIPE_SECRET_KEY=sk_live_...
GOOGLE_MAPS_API_KEY=AIza...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

**Frontend (.env)**
```
VITE_API_URL=https://your-backend-url.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

---

This comprehensive documentation provides the foundation for building your parking marketplace. Each section can be expanded with more detailed implementation examples as you progress through development.