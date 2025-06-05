# Database Schema & Models Documentation

## Table of Contents
1. [Database Overview](#database-overview)
2. [PostgreSQL Configuration](#postgresql-configuration)
3. [Core Models](#core-models)
4. [Model Relationships](#model-relationships)
5. [Database Indexes](#database-indexes)
6. [PostGIS Integration](#postgis-integration)
7. [Data Migration Strategy](#data-migration-strategy)
8. [Performance Optimization](#performance-optimization)

## Database Overview

The Parking in a Pinch database uses PostgreSQL with PostGIS extension for geospatial queries. The schema is designed to support a two-sided marketplace with real-time availability, booking management, and location-based search.

### Key Design Principles
- Normalized structure to prevent data redundancy
- Proper indexing for performance
- PostGIS for efficient location queries
- Soft deletes for data integrity
- Audit trails for critical operations

## PostgreSQL Configuration

### Database Setup
```sql
-- Create database with PostGIS
CREATE DATABASE parking_pinch;
\c parking_pinch;
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
CREATE EXTENSION fuzzystrmatch;
CREATE EXTENSION postgis_tiger_geocoder;

-- Create user
CREATE USER parking_app WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE parking_pinch TO parking_app;
```

### Connection Pool Configuration
```python
# config/settings/base.py
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'parking_pinch',
        'USER': 'parking_app',
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,  # Connection pooling
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}
```

## Core Models

### User Model
```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models
from django.core.validators import RegexValidator

class User(AbstractUser):
    class UserType(models.TextChoices):
        SEEKER = 'SEEKER', 'Parking Seeker'
        HOST = 'HOST', 'Space Host'
        BOTH = 'BOTH', 'Both Seeker and Host'
    
    # Basic Information
    email = models.EmailField(unique=True)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$')
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    user_type = models.CharField(max_length=10, choices=UserType.choices, default=UserType.SEEKER)
    
    # Profile Details
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # Verification
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    is_identity_verified = models.BooleanField(default=False)
    driver_license_number = models.CharField(max_length=50, blank=True)
    driver_license_state = models.CharField(max_length=2, blank=True)
    
    # Location
    default_location = models.PointField(null=True, blank=True, srid=4326)
    default_address = models.CharField(max_length=255, blank=True)
    
    # Payment Information
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    stripe_account_id = models.CharField(max_length=255, blank=True)  # For hosts
    
    # Preferences
    preferred_notification_method = models.CharField(
        max_length=10,
        choices=[('email', 'Email'), ('sms', 'SMS'), ('push', 'Push')],
        default='email'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['user_type']),
            models.Index(fields=['stripe_customer_id']),
        ]
```

### Listing Model
```python
# apps/listings/models.py
from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator, MaxValueValidator

class Listing(models.Model):
    class SpotType(models.TextChoices):
        DRIVEWAY = 'DRIVEWAY', 'Driveway'
        GARAGE = 'GARAGE', 'Garage'
        LOT = 'LOT', 'Parking Lot'
        STREET = 'STREET', 'Street Parking'
        COVERED = 'COVERED', 'Covered Parking'
        VALET = 'VALET', 'Valet Parking'
    
    class VehicleSize(models.TextChoices):
        MOTORCYCLE = 'MOTORCYCLE', 'Motorcycle'
        COMPACT = 'COMPACT', 'Compact Car'
        SEDAN = 'SEDAN', 'Sedan'
        SUV = 'SUV', 'SUV/Truck'
        OVERSIZED = 'OVERSIZED', 'Oversized Vehicle'
    
    # Ownership
    host = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='listings')
    
    # Basic Information
    title = models.CharField(max_length=100)
    description = models.TextField()
    spot_type = models.CharField(max_length=20, choices=SpotType.choices)
    
    # Location
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    zip_code = models.CharField(max_length=10)
    location = models.PointField(srid=4326)  # PostGIS point field
    
    # Pricing
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    price_per_day = models.DecimalField(max_digits=6, decimal_places=2)
    price_per_week = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    price_per_month = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Specifications
    max_vehicle_size = models.CharField(max_length=20, choices=VehicleSize.choices, default=VehicleSize.SEDAN)
    spaces_available = models.PositiveIntegerField(default=1)
    width = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)  # in feet
    length = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)  # in feet
    height_clearance = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)  # in feet
    
    # Features
    features = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    # Examples: 'covered', 'gated', 'security_camera', 'well_lit', 'ev_charging', 'handicap_accessible'
    
    # Access Information
    access_instructions = models.TextField(blank=True)
    gate_code = models.CharField(max_length=20, blank=True)
    
    # Availability
    is_active = models.BooleanField(default=True)
    instant_booking = models.BooleanField(default=True)
    minimum_hours = models.PositiveIntegerField(default=1)
    maximum_days = models.PositiveIntegerField(default=30)
    
    # Operating Hours
    available_start_time = models.TimeField(default='00:00')
    available_end_time = models.TimeField(default='23:59')
    available_days = ArrayField(
        models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(6)]),
        default=list,
        size=7
    )  # 0=Monday, 6=Sunday
    
    # Reviews
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    rating_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'listings'
        indexes = [
            models.Index(fields=['host']),
            models.Index(fields=['spot_type']),
            models.Index(fields=['city', 'state']),
            models.Index(fields=['price_per_day']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]

class ListingPhoto(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='listings/')
    caption = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'listing_photos'
        ordering = ['display_order', 'uploaded_at']
```

### Booking Model
```python
# apps/bookings/models.py
from django.contrib.gis.db import models
from django.contrib.postgres.fields import JSONField
import uuid

class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Host Approval'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        COMPLETED = 'COMPLETED', 'Completed'
        NO_SHOW = 'NO_SHOW', 'No Show'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    
    # Unique identifier
    booking_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    # Relationships
    guest = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='bookings_as_guest')
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='bookings')
    
    # Booking Details
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    duration_hours = models.DecimalField(max_digits=6, decimal_places=2)
    
    # Vehicle Information
    vehicle_make = models.CharField(max_length=50)
    vehicle_model = models.CharField(max_length=50)
    vehicle_color = models.CharField(max_length=30)
    vehicle_license_plate = models.CharField(max_length=20)
    vehicle_state = models.CharField(max_length=2)
    
    # Pricing
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2, null=True)
    price_per_day = models.DecimalField(max_digits=6, decimal_places=2, null=True)
    subtotal = models.DecimalField(max_digits=8, decimal_places=2)
    service_fee = models.DecimalField(max_digits=6, decimal_places=2)
    host_payout = models.DecimalField(max_digits=8, decimal_places=2)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2)
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Check-in/out
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    check_in_photo = models.ImageField(upload_to='checkins/', null=True, blank=True)
    check_out_photo = models.ImageField(upload_to='checkouts/', null=True, blank=True)
    
    # Cancellation
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='cancelled_bookings')
    cancellation_reason = models.TextField(blank=True)
    
    # Payment
    payment_intent_id = models.CharField(max_length=255, blank=True)
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('succeeded', 'Succeeded'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
            ('partial_refund', 'Partially Refunded')
        ],
        default='pending'
    )
    refund_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Metadata
    guest_notes = models.TextField(blank=True)
    host_notes = models.TextField(blank=True)
    metadata = JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bookings'
        indexes = [
            models.Index(fields=['guest']),
            models.Index(fields=['listing']),
            models.Index(fields=['status']),
            models.Index(fields=['start_datetime']),
            models.Index(fields=['end_datetime']),
            models.Index(fields=['booking_code']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_datetime__gt=models.F('start_datetime')),
                name='booking_end_after_start'
            )
        ]
```

### Review Model
```python
# apps/reviews/models.py
from django.contrib.gis.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Review(models.Model):
    class ReviewType(models.TextChoices):
        GUEST_TO_HOST = 'G2H', 'Guest to Host'
        HOST_TO_GUEST = 'H2G', 'Host to Guest'
    
    # Relationships
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews_given')
    reviewee = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews_received')
    review_type = models.CharField(max_length=3, choices=ReviewType.choices)
    
    # Ratings
    overall_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    # Guest to Host specific ratings
    location_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    value_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    cleanliness_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    communication_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    
    # Review Content
    title = models.CharField(max_length=100, blank=True)
    comment = models.TextField()
    
    # Response
    response = models.TextField(blank=True)
    response_date = models.DateTimeField(null=True, blank=True)
    
    # Moderation
    is_published = models.BooleanField(default=True)
    is_reported = models.BooleanField(default=False)
    report_reason = models.TextField(blank=True)
    moderated_at = models.DateTimeField(null=True, blank=True)
    moderated_by = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='moderated_reviews')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reviews'
        indexes = [
            models.Index(fields=['booking']),
            models.Index(fields=['reviewer']),
            models.Index(fields=['reviewee']),
            models.Index(fields=['overall_rating']),
            models.Index(fields=['is_published']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['booking', 'reviewer'],
                name='unique_review_per_booking_reviewer'
            )
        ]
```

### Message Model
```python
# apps/messaging/models.py
from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField

class Conversation(models.Model):
    participants = models.ManyToManyField('users.User', related_name='conversations')
    listing = models.ForeignKey('listings.Listing', on_delete=models.SET_NULL, null=True, blank=True)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Last message info for optimization
    last_message = models.TextField(blank=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_by = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversations'
        indexes = [
            models.Index(fields=['last_message_at']),
        ]

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='sent_messages')
    
    # Content
    content = models.TextField()
    attachments = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    
    # Read receipts
    read_by = models.ManyToManyField('users.User', related_name='read_messages', blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Moderation
    is_flagged = models.BooleanField(default=False)
    flagged_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'messages'
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender']),
        ]
```

### Payment Models
```python
# apps/payments/models.py
from django.contrib.gis.db import models
from django.contrib.postgres.fields import JSONField

class PaymentMethod(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='payment_methods')
    stripe_payment_method_id = models.CharField(max_length=255, unique=True)
    
    # Card details (last 4 digits only)
    brand = models.CharField(max_length=20)  # visa, mastercard, etc.
    last4 = models.CharField(max_length=4)
    exp_month = models.IntegerField()
    exp_year = models.IntegerField()
    
    # Metadata
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payment_methods'

class Transaction(models.Model):
    class TransactionType(models.TextChoices):
        BOOKING_PAYMENT = 'BOOKING', 'Booking Payment'
        REFUND = 'REFUND', 'Refund'
        PAYOUT = 'PAYOUT', 'Host Payout'
        FEE = 'FEE', 'Platform Fee'
    
    # References
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='transactions')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='transactions')
    
    # Transaction Details
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    # Stripe References
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    stripe_transfer_id = models.CharField(max_length=255, blank=True)
    stripe_refund_id = models.CharField(max_length=255, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('cancelled', 'Cancelled')
        ]
    )
    
    # Metadata
    description = models.TextField()
    metadata = JSONField(default=dict)
    failure_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'transactions'
        indexes = [
            models.Index(fields=['booking']),
            models.Index(fields=['user']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

class Payout(models.Model):
    host = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='payouts')
    
    # Payout Details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Bookings included
    bookings = models.ManyToManyField('bookings.Booking', related_name='payouts')
    
    # Stripe References
    stripe_payout_id = models.CharField(max_length=255, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('paid', 'Paid'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payouts'
        indexes = [
            models.Index(fields=['host']),
            models.Index(fields=['status']),
            models.Index(fields=['period_start', 'period_end']),
        ]
```

## Model Relationships

### Entity Relationship Diagram
```
User (1) ----< (M) Listing
User (1) ----< (M) Booking (as guest)
User (1) ----< (M) Review (as reviewer)
User (1) ----< (M) Review (as reviewee)
User (1) ----< (M) PaymentMethod
User (1) ----< (M) Transaction
User (1) ----< (M) Payout
User (M) >----< (M) Conversation

Listing (1) ----< (M) ListingPhoto
Listing (1) ----< (M) Booking
Listing (1) ----< (M) Conversation

Booking (1) ----< (M) Review
Booking (1) ----< (M) Transaction
Booking (M) >----< (M) Payout

Conversation (1) ----< (M) Message
```

### Key Relationships
1. **User-Listing**: One-to-many (host can have multiple listings)
2. **User-Booking**: One-to-many (as guest and through listings as host)
3. **Listing-Booking**: One-to-many (listing can have multiple bookings)
4. **Booking-Review**: One-to-many (max 2 reviews per booking)
5. **User-Conversation**: Many-to-many (through participants)
6. **Booking-Payout**: Many-to-many (payouts batch multiple bookings)

## Database Indexes

### Performance-Critical Indexes
```sql
-- Spatial index for location-based queries
CREATE INDEX idx_listings_location ON listings USING GIST(location);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_listing_dates ON bookings(listing_id, start_datetime, end_datetime);
CREATE INDEX idx_bookings_guest_status ON bookings(guest_id, status);
CREATE INDEX idx_listings_active_city ON listings(is_active, city) WHERE is_deleted = false;

-- Full-text search indexes
CREATE INDEX idx_listings_search ON listings USING GIN(to_tsvector('english', title || ' ' || description));

-- Partial indexes for active records
CREATE INDEX idx_active_listings ON listings(created_at) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_confirmed_bookings ON bookings(start_datetime) WHERE status = 'CONFIRMED';
```

### Query Optimization Examples
```python
# Efficient nearby listings query
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance

nearby_listings = Listing.objects.filter(
    location__distance_lte=(user_location, D(mi=5)),
    is_active=True,
    is_deleted=False
).annotate(
    distance=Distance('location', user_location)
).order_by('distance')[:20]

# Availability check with proper indexing
from django.db.models import Q

available_listings = Listing.objects.filter(
    ~Q(bookings__status='CONFIRMED') |
    ~Q(bookings__start_datetime__lt=end_time) |
    ~Q(bookings__end_datetime__gt=start_time)
).distinct()
```

## PostGIS Integration

### Spatial Queries
```python
# Find listings within polygon (neighborhood)
from django.contrib.gis.geos import Polygon

neighborhood = Polygon((
    (-73.98, 40.75),
    (-73.95, 40.75),
    (-73.95, 40.78),
    (-73.98, 40.78),
    (-73.98, 40.75)
))

listings_in_area = Listing.objects.filter(
    location__within=neighborhood
)

# Find listings along route
from django.contrib.gis.geos import LineString

route = LineString((
    (-73.98, 40.75),
    (-73.97, 40.76),
    (-73.96, 40.77)
))

listings_along_route = Listing.objects.filter(
    location__distance_lte=(route, D(m=200))
)
```

### Geocoding Integration
```python
# apps/listings/utils.py
from django.contrib.gis.geos import Point
import googlemaps

def geocode_address(address):
    gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
    result = gmaps.geocode(address)
    
    if result:
        location = result[0]['geometry']['location']
        return Point(location['lng'], location['lat'], srid=4326)
    return None
```

## Data Migration Strategy

### Initial Migration
```python
# apps/listings/migrations/0002_populate_spatial_data.py
from django.db import migrations
from django.contrib.gis.geos import Point

def populate_locations(apps, schema_editor):
    Listing = apps.get_model('listings', 'Listing')
    
    for listing in Listing.objects.filter(location__isnull=True):
        # Geocode address and update location
        if listing.latitude and listing.longitude:
            listing.location = Point(listing.longitude, listing.latitude, srid=4326)
            listing.save()

class Migration(migrations.Migration):
    dependencies = [
        ('listings', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(populate_locations),
    ]
```

### Data Integrity Checks
```sql
-- Check for orphaned bookings
SELECT b.* FROM bookings b
LEFT JOIN listings l ON b.listing_id = l.id
WHERE l.id IS NULL;

-- Check for duplicate payment methods
SELECT user_id, COUNT(*) as count
FROM payment_methods
WHERE is_default = true
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Validate booking date ranges
SELECT * FROM bookings
WHERE end_datetime <= start_datetime;
```

## Performance Optimization

### Database Configuration
```sql
-- PostgreSQL performance tuning
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '10MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';
```

### Query Optimization
```python
# Use select_related and prefetch_related
bookings = Booking.objects.select_related(
    'guest', 'listing', 'listing__host'
).prefetch_related(
    'reviews', 'transactions'
).filter(
    guest=user,
    status='CONFIRMED'
)

# Use only() for specific fields
listings = Listing.objects.only(
    'id', 'title', 'price_per_day', 'location', 'rating_average'
).filter(is_active=True)

# Bulk operations
from django.db.models import F

Listing.objects.filter(
    id__in=listing_ids
).update(
    rating_count=F('rating_count') + 1
)
```

### Caching Strategy
```python
# Redis caching for frequently accessed data
from django.core.cache import cache

def get_listing_details(listing_id):
    cache_key = f'listing:{listing_id}'
    listing = cache.get(cache_key)
    
    if not listing:
        listing = Listing.objects.select_related('host').prefetch_related(
            'photos', 'reviews'
        ).get(id=listing_id)
        cache.set(cache_key, listing, 3600)  # Cache for 1 hour
    
    return listing
```

## Advanced Database Features

### Availability Management
```python
# apps/listings/models.py
class AvailabilityRule(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='availability_rules')
    
    # Recurring availability patterns
    rule_type = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('date_range', 'Date Range'),
        ('exception', 'Exception')
    ])
    
    # Date/time constraints
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Days of week (for weekly rules)
    days_of_week = ArrayField(
        models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(6)]),
        default=list,
        blank=True
    )
    
    # Availability status
    is_available = models.BooleanField(default=True)
    max_bookings = models.PositiveIntegerField(default=1)
    
    # Pricing overrides
    price_override = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'availability_rules'
        indexes = [
            models.Index(fields=['listing', 'start_date', 'end_date']),
            models.Index(fields=['rule_type']),
        ]

class AvailabilityException(models.Model):
    """Specific date exceptions to availability rules"""
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='availability_exceptions')
    exception_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_available = models.BooleanField(default=False)
    reason = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'availability_exceptions'
        unique_together = ['listing', 'exception_date']
```

### Notification System
```python
# apps/notifications/models.py
class NotificationTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=200)
    email_template = models.TextField()
    sms_template = models.TextField(blank=True)
    push_template = models.TextField(blank=True)
    
    # Template variables documentation
    variables = JSONField(default=dict)  # {variable_name: description}
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notification_templates'

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        BOOKING_CONFIRMED = 'BOOKING_CONFIRMED', 'Booking Confirmed'
        BOOKING_CANCELLED = 'BOOKING_CANCELLED', 'Booking Cancelled'
        PAYMENT_RECEIVED = 'PAYMENT_RECEIVED', 'Payment Received'
        MESSAGE_RECEIVED = 'MESSAGE_RECEIVED', 'Message Received'
        LISTING_APPROVED = 'LISTING_APPROVED', 'Listing Approved'
        REMINDER_CHECKIN = 'REMINDER_CHECKIN', 'Check-in Reminder'
        REMINDER_CHECKOUT = 'REMINDER_CHECKOUT', 'Check-out Reminder'
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'
        READ = 'READ', 'Read'
    
    recipient = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    
    # Content
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Delivery channels
    send_email = models.BooleanField(default=True)
    send_sms = models.BooleanField(default=False)
    send_push = models.BooleanField(default=True)
    
    # Status tracking
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    email_status = models.CharField(max_length=10, blank=True)
    sms_status = models.CharField(max_length=10, blank=True)
    push_status = models.CharField(max_length=10, blank=True)
    
    # Related objects
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Metadata
    data = JSONField(default=dict)  # Additional template variables
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]
```

### Analytics and Reporting Models
```python
# apps/analytics/models.py
class ListingView(models.Model):
    """Track listing page views for analytics"""
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Session tracking
    session_id = models.CharField(max_length=40)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    # Referrer information
    referrer_url = models.URLField(blank=True)
    utm_source = models.CharField(max_length=100, blank=True)
    utm_medium = models.CharField(max_length=100, blank=True)
    utm_campaign = models.CharField(max_length=100, blank=True)
    
    # Geographic data
    country = models.CharField(max_length=2, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'listing_views'
        indexes = [
            models.Index(fields=['listing', 'viewed_at']),
            models.Index(fields=['user', 'viewed_at']),
            models.Index(fields=['session_id']),
        ]

class SearchQuery(models.Model):
    """Track search queries for optimization"""
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=40)
    
    # Search parameters
    query_text = models.CharField(max_length=255, blank=True)
    location = models.PointField(null=True, blank=True, srid=4326)
    location_text = models.CharField(max_length=255, blank=True)
    
    # Filters
    price_min = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    price_max = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    spot_types = ArrayField(models.CharField(max_length=20), default=list, blank=True)
    
    # Results
    results_count = models.PositiveIntegerField(default=0)
    clicked_listing_id = models.PositiveIntegerField(null=True, blank=True)
    
    searched_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'search_queries'
        indexes = [
            models.Index(fields=['searched_at']),
            models.Index(fields=['user']),
            models.Index(fields=['query_text']),
        ]
```

### Audit Trail System
```python
# apps/core/models.py
class AuditLog(models.Model):
    """Comprehensive audit trail for all important actions"""
    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        BOOKING_CREATE = 'BOOKING_CREATE', 'Booking Created'
        BOOKING_CANCEL = 'BOOKING_CANCEL', 'Booking Cancelled'
        PAYMENT_PROCESS = 'PAYMENT_PROCESS', 'Payment Processed'
        PAYOUT_PROCESS = 'PAYOUT_PROCESS', 'Payout Processed'
    
    # User information
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    user_email = models.EmailField(blank=True)  # Store even if user deleted
    
    # Action details
    action = models.CharField(max_length=20, choices=Action.choices)
    description = models.TextField()
    
    # Object being acted upon
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Request context
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    request_path = models.CharField(max_length=255, blank=True)
    
    # Changes (for UPDATE actions)
    old_values = JSONField(default=dict, blank=True)
    new_values = JSONField(default=dict, blank=True)
    
    # Metadata
    additional_data = JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]
```

## Database Security and Compliance

### Data Encryption
```sql
-- Enable row-level security for sensitive data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Encryption for sensitive fields
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example: Encrypt driver license numbers
UPDATE users SET driver_license_number = pgp_sym_encrypt(driver_license_number, 'encryption_key')
WHERE driver_license_number IS NOT NULL;
```

### Backup Strategy
```bash
#!/bin/bash
# Database backup script
pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --format=custom \
  --compress=9 \
  --verbose \
  parking_pinch > backup_$(date +%Y%m%d_%H%M%S).dump

# Upload to S3 with encryption
aws s3 cp backup_*.dump s3://parking-backups/ \
  --sse AES256 \
  --storage-class STANDARD_IA
```

### Data Retention Policies
```python
# apps/core/management/commands/cleanup_old_data.py
from django.core.management.base import BaseCommand
from datetime import datetime, timedelta

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Delete old search queries (90 days)
        cutoff_date = datetime.now() - timedelta(days=90)
        SearchQuery.objects.filter(searched_at__lt=cutoff_date).delete()
        
        # Delete old listing views (365 days)
        cutoff_date = datetime.now() - timedelta(days=365)
        ListingView.objects.filter(viewed_at__lt=cutoff_date).delete()
        
        # Archive old audit logs (7 years for compliance)
        cutoff_date = datetime.now() - timedelta(days=2557)  # ~7 years
        old_logs = AuditLog.objects.filter(created_at__lt=cutoff_date)
        # Archive to cold storage before deletion
        old_logs.delete()
```