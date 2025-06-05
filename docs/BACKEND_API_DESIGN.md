# Backend Setup & API Design Documentation

## Table of Contents
1. [Backend Overview](#backend-overview)
2. [Django Project Setup](#django-project-setup)
3. [Application Structure](#application-structure)
4. [API Design Principles](#api-design-principles)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [Real-time Features](#real-time-features)
8. [Background Tasks](#background-tasks)
9. [Third-party Integrations](#third-party-integrations)
10. [Testing Strategy](#testing-strategy)

## Backend Overview

The Parking in a Pinch backend is built with Django and Django REST Framework, providing a robust API for the React frontend. It handles user authentication, parking spot management, bookings, payments, and real-time communications.

### Core Technologies
- **Django 4.2+** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL + PostGIS** - Spatial database
- **Redis** - Caching and sessions
- **Celery** - Asynchronous tasks
- **Django Channels** - WebSocket support
- **Stripe** - Payment processing

## Django Project Setup

### Initial Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create Django project
pip install django djangorestframework
django-admin startproject config .
```

### Requirements File
```txt
# requirements.txt
Django==4.2.8
djangorestframework==3.14.0
django-cors-headers==4.3.0
django-environ==0.11.2
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
django-celery-beat==2.5.0
channels==4.0.0
channels-redis==4.2.0
dj-rest-auth==5.0.2
django-allauth==0.58.2
djangorestframework-simplejwt==5.3.1
django-filter==23.5
drf-spectacular==0.27.0
Pillow==10.1.0
boto3==1.34.0
django-storages==1.14.2
stripe==7.8.0
django-extensions==3.2.3
django-debug-toolbar==4.2.0
pytest-django==4.7.0
factory-boy==3.3.0
coverage==7.3.4
black==23.12.0
flake8==6.1.0
gunicorn==21.2.0
whitenoise==6.6.0
sentry-sdk==1.39.1
```

### Django Settings Structure
```python
# config/settings/base.py
from pathlib import Path
import environ

env = environ.Env()
environ.Env.read_env()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=False)

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',  # PostGIS support
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
    'dj_rest_auth',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'django_filters',
    'channels',
    'storages',
    'drf_spectacular',
]

LOCAL_APPS = [
    'apps.users',
    'apps.listings',
    'apps.bookings',
    'apps.payments',
    'apps.reviews',
    'apps.messaging',
    'apps.notifications',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Celery Configuration
CELERY_BROKER_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'America/New_York'

# Channels Configuration
ASGI_APPLICATION = 'config.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [env('REDIS_URL', default='redis://localhost:6379/1')],
        },
    },
}
```

## Application Structure

### Project Layout
```
backend/
├── config/
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── users/
│   ├── listings/
│   ├── bookings/
│   ├── payments/
│   ├── reviews/
│   ├── messaging/
│   └── notifications/
├── api/
│   ├── v1/
│   │   ├── urls.py
│   │   └── views.py
│   └── schema.py
├── core/
│   ├── models.py
│   ├── permissions.py
│   ├── pagination.py
│   └── exceptions.py
├── utils/
│   ├── validators.py
│   ├── geocoding.py
│   └── email.py
├── tests/
├── media/
├── static/
└── manage.py
```

### App Structure Example
```
apps/listings/
├── __init__.py
├── admin.py
├── apps.py
├── models.py
├── serializers.py
├── views.py
├── urls.py
├── filters.py
├── permissions.py
├── signals.py
├── tasks.py
├── tests/
│   ├── test_models.py
│   ├── test_views.py
│   └── test_serializers.py
└── migrations/
```

## API Design Principles

### RESTful Standards
1. Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
2. Consistent URL patterns
3. Proper status codes
4. HATEOAS where applicable
5. Versioning strategy

### URL Patterns
```python
# api/v1/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'listings', ListingViewSet)
router.register(r'bookings', BookingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
    path('payments/', include('apps.payments.urls')),
    path('messages/', include('apps.messaging.urls')),
]
```

### Response Format
```json
{
  "status": "success",
  "data": {
    "results": [],
    "count": 100,
    "next": "http://api.example.com/listings?page=2",
    "previous": null
  },
  "message": "Listings retrieved successfully"
}
```

### Error Response Format
```json
{
  "status": "error",
  "errors": {
    "field_name": ["Error message"],
    "non_field_errors": ["General error message"]
  },
  "message": "Validation failed",
  "error_code": "VALIDATION_ERROR"
}
```

## API Endpoints

### Authentication Endpoints
```
POST   /api/v1/auth/registration/          # User registration
POST   /api/v1/auth/login/                 # User login
POST   /api/v1/auth/logout/                # User logout
POST   /api/v1/auth/password/reset/        # Password reset request
POST   /api/v1/auth/password/reset/confirm/ # Password reset confirm
POST   /api/v1/auth/token/refresh/         # Refresh JWT token
GET    /api/v1/auth/user/                  # Get current user
PUT    /api/v1/auth/user/                  # Update user profile
```

### User Management
```
GET    /api/v1/users/                      # List users (admin only)
GET    /api/v1/users/{id}/                 # Get user details
PUT    /api/v1/users/{id}/                 # Update user
DELETE /api/v1/users/{id}/                 # Delete user
POST   /api/v1/users/{id}/verify/          # Verify user identity
GET    /api/v1/users/me/stats/             # Get user statistics
```

### Listing Management
```
GET    /api/v1/listings/                   # List all listings
POST   /api/v1/listings/                   # Create new listing
GET    /api/v1/listings/{id}/              # Get listing details
PUT    /api/v1/listings/{id}/              # Update listing
DELETE /api/v1/listings/{id}/              # Delete listing
POST   /api/v1/listings/{id}/photos/       # Upload photos
DELETE /api/v1/listings/{id}/photos/{photo_id}/ # Delete photo
GET    /api/v1/listings/search/            # Search listings
GET    /api/v1/listings/nearby/            # Get nearby listings
POST   /api/v1/listings/{id}/availability/ # Update availability
```

### Booking Management
```
GET    /api/v1/bookings/                   # List user bookings
POST   /api/v1/bookings/                   # Create booking
GET    /api/v1/bookings/{id}/              # Get booking details
PUT    /api/v1/bookings/{id}/              # Update booking
DELETE /api/v1/bookings/{id}/              # Cancel booking
POST   /api/v1/bookings/{id}/confirm/      # Confirm booking (host)
POST   /api/v1/bookings/{id}/decline/      # Decline booking (host)
POST   /api/v1/bookings/{id}/checkin/      # Check-in
POST   /api/v1/bookings/{id}/checkout/     # Check-out
```

### Payment Processing
```
POST   /api/v1/payments/setup-intent/      # Create Stripe setup intent
POST   /api/v1/payments/payment-intent/    # Create payment intent
POST   /api/v1/payments/confirm/           # Confirm payment
GET    /api/v1/payments/methods/           # List payment methods
POST   /api/v1/payments/methods/           # Add payment method
DELETE /api/v1/payments/methods/{id}/      # Remove payment method
GET    /api/v1/payments/transactions/      # Transaction history
POST   /api/v1/payments/payout/            # Request payout (host)
```

### Reviews & Ratings
```
GET    /api/v1/reviews/                    # List reviews
POST   /api/v1/reviews/                    # Create review
GET    /api/v1/reviews/{id}/               # Get review details
PUT    /api/v1/reviews/{id}/               # Update review
DELETE /api/v1/reviews/{id}/               # Delete review
POST   /api/v1/reviews/{id}/report/        # Report review
```

### Messaging
```
GET    /api/v1/messages/conversations/     # List conversations
POST   /api/v1/messages/conversations/     # Start conversation
GET    /api/v1/messages/conversations/{id}/ # Get messages
POST   /api/v1/messages/send/              # Send message
PUT    /api/v1/messages/{id}/read/         # Mark as read
DELETE /api/v1/messages/{id}/              # Delete message
```

## Authentication & Authorization

### JWT Configuration
```python
# config/settings/base.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### Custom Permissions
```python
# core/permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Read permissions for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions only for owner
        return obj.owner == request.user

class IsHostOfListing(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.listing.host == request.user

class IsParticipantInBooking(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user in [obj.guest, obj.listing.host]
```

### User Roles
```python
# apps/users/models.py
class User(AbstractUser):
    class UserType(models.TextChoices):
        SEEKER = 'SEEKER', 'Seeker'
        HOST = 'HOST', 'Host'
        BOTH = 'BOTH', 'Both'
        
    user_type = models.CharField(max_length=10, choices=UserType.choices, default=UserType.SEEKER)
    is_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True)
    
    def can_host(self):
        return self.user_type in [self.UserType.HOST, self.UserType.BOTH]
    
    def can_book(self):
        return self.user_type in [self.UserType.SEEKER, self.UserType.BOTH]
```

## Real-time Features

### WebSocket Configuration
```python
# config/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter([
                # WebSocket URL patterns
            ])
        )
    ),
})
```

### WebSocket Consumer Example
```python
# apps/messaging/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation_group_name = f'chat_{self.conversation_id}'
        
        # Join conversation group
        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave conversation group
        await self.channel_layer.group_discard(
            self.conversation_group_name,
            self.channel_name
        )
    
    async def receive_json(self, content):
        message_type = content.get('type')
        
        if message_type == 'chat_message':
            await self.handle_chat_message(content)
        elif message_type == 'typing_indicator':
            await self.handle_typing_indicator(content)
    
    async def handle_chat_message(self, content):
        # Save message to database
        message = await self.save_message(content)
        
        # Send message to conversation group
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': self.scope['user'].id
            }
        )
    
    @database_sync_to_async
    def save_message(self, content):
        # Database operations
        pass
```

## Background Tasks

### Celery Tasks
```python
# apps/notifications/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string

@shared_task
def send_booking_confirmation_email(booking_id):
    from apps.bookings.models import Booking
    booking = Booking.objects.get(id=booking_id)
    
    context = {
        'booking': booking,
        'user': booking.guest,
        'listing': booking.listing,
    }
    
    html_message = render_to_string('emails/booking_confirmation.html', context)
    
    send_mail(
        subject=f'Booking Confirmation - {booking.listing.title}',
        message='',
        html_message=html_message,
        from_email='noreply@parkinginapinch.com',
        recipient_list=[booking.guest.email],
    )

@shared_task
def update_listing_availability():
    """Update listing availability based on completed bookings"""
    from apps.listings.models import Listing
    from datetime import datetime, timedelta
    
    # Logic to update availability
    pass

@shared_task
def process_payouts():
    """Process weekly payouts to hosts"""
    from apps.payments.models import Payout
    
    # Logic to process payouts
    pass
```

### Celery Beat Schedule
```python
# config/settings/base.py
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'update-listing-availability': {
        'task': 'apps.notifications.tasks.update_listing_availability',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    'process-weekly-payouts': {
        'task': 'apps.payments.tasks.process_payouts',
        'schedule': crontab(hour=9, minute=0, day_of_week=1),  # Monday 9 AM
    },
    'cleanup-expired-bookings': {
        'task': 'apps.bookings.tasks.cleanup_expired_bookings',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}
```

## Third-party Integrations

### Stripe Integration
```python
# apps/payments/services.py
import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    @staticmethod
    def create_customer(user):
        return stripe.Customer.create(
            email=user.email,
            name=user.get_full_name(),
            metadata={'user_id': user.id}
        )
    
    @staticmethod
    def create_payment_intent(booking):
        return stripe.PaymentIntent.create(
            amount=int(booking.total_amount * 100),  # Amount in cents
            currency='usd',
            customer=booking.guest.stripe_customer_id,
            metadata={
                'booking_id': booking.id,
                'listing_id': booking.listing.id,
            },
            transfer_data={
                'destination': booking.listing.host.stripe_account_id,
            }
        )
    
    @staticmethod
    def create_payout(host, amount):
        return stripe.Transfer.create(
            amount=int(amount * 100),
            currency='usd',
            destination=host.stripe_account_id,
            description=f'Payout for {host.get_full_name()}'
        )
```

### AWS S3 Storage
```python
# config/settings/production.py
AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = 'us-east-1'
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
AWS_DEFAULT_ACL = 'public-read'

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'
```

### Email Configuration
```python
# config/settings/base.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env('EMAIL_PORT', default=587)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = 'Parking in a Pinch <noreply@parkinginapinch.com>'
```

## Testing Strategy

### Test Configuration
```python
# config/settings/testing.py
from .base import *

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.spatialite',
        'NAME': ':memory:',
    }
}

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
CELERY_TASK_ALWAYS_EAGER = True
```

### Test Examples
```python
# apps/listings/tests/test_views.py
import pytest
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.listings.models import Listing

User = get_user_model()

class ListingViewSetTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_listing(self):
        data = {
            'title': 'Test Parking Spot',
            'description': 'A great parking spot',
            'address': '123 Test St, New York, NY',
            'price_per_hour': 5.00,
            'price_per_day': 25.00,
            'spot_type': 'driveway',
        }
        response = self.client.post('/api/v1/listings/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Listing.objects.count(), 1)
    
    def test_list_listings(self):
        # Create test listings
        Listing.objects.create(
            host=self.user,
            title='Listing 1',
            price_per_day=20.00
        )
        Listing.objects.create(
            host=self.user,
            title='Listing 2',
            price_per_day=30.00
        )
        
        response = self.client.get('/api/v1/listings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    @pytest.mark.django_db
    def test_search_listings_by_location(self):
        # Test spatial queries
        pass
```

### Factory Pattern
```python
# apps/listings/tests/factories.py
import factory
from factory.django import DjangoModelFactory
from apps.listings.models import Listing

class UserFactory(DjangoModelFactory):
    class Meta:
        model = 'users.User'
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')

class ListingFactory(DjangoModelFactory):
    class Meta:
        model = Listing
    
    host = factory.SubFactory(UserFactory)
    title = factory.Faker('sentence', nb_words=4)
    description = factory.Faker('text')
    address = factory.Faker('address')
    price_per_hour = factory.Faker('random_number', digits=2)
    price_per_day = factory.Faker('random_number', digits=3)
```