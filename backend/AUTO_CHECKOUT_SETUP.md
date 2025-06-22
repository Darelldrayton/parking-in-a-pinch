# Auto Checkout Setup

This document explains how to set up the automatic checkout feature that checks out users after 1 hour of parking.

## Overview

The auto-checkout system automatically checks out users who have been parked for more than 1 hour. When a user is auto-checked out:
- Their `actual_end_time` is set to exactly 1 hour after their `actual_start_time`
- The `auto_checkout` field is set to `True`
- The booking status is changed to `completed`
- The frontend displays "AUTO" next to the checkout time

## Implementation

### 1. Database Migration

First, run the migration to add the `auto_checkout` field:

```bash
cd backend
python manage.py makemigrations bookings
python manage.py migrate
```

### 2. Manual Execution (Development)

For development/testing, you can manually run the auto-checkout command:

```bash
# Dry run (see what would be checked out)
python manage.py auto_checkout --dry-run

# Actually perform auto-checkout
python manage.py auto_checkout
```

### 3. Scheduled Execution (Production)

#### Option A: Cron Job (Simple)

Add this to your crontab to run every 15 minutes:

```bash
# Edit crontab
crontab -e

# Add this line to run every 15 minutes
*/15 * * * * cd /path/to/your/backend && python manage.py auto_checkout >> /var/log/auto_checkout.log 2>&1
```

#### Option B: Celery Beat (Advanced)

If you're using Celery, add this to your celery configuration:

```python
# In your Django settings
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'auto-checkout-bookings': {
        'task': 'apps.bookings.tasks.auto_checkout_bookings',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    'check-expired-bookings': {
        'task': 'apps.bookings.tasks.check_expired_bookings', 
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
}
```

Then run celery beat:

```bash
celery -A your_project beat --loglevel=info
```

#### Option C: Systemd Timer (Linux)

Create a systemd service and timer:

```bash
# /etc/systemd/system/auto-checkout.service
[Unit]
Description=Auto checkout parking bookings
After=network.target

[Service]
Type=oneshot
User=your_user
WorkingDirectory=/path/to/your/backend
ExecStart=/path/to/your/venv/bin/python manage.py auto_checkout
```

```bash
# /etc/systemd/system/auto-checkout.timer
[Unit]
Description=Run auto-checkout every 15 minutes
Requires=auto-checkout.service

[Timer]
OnCalendar=*:0/15
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
sudo systemctl enable auto-checkout.timer
sudo systemctl start auto-checkout.timer
```

## Frontend Display

The frontend automatically displays "AUTO" for auto-checked out bookings:

- In the Check-in/Check-out Times section: "Jun 21, 2025 2:20 PM AUTO"
- In the Booking Timeline: "Checked Out (Auto)" and "Jun 21, 2025 2:20 PM AUTO"

## Monitoring

### Logs

The auto-checkout process logs to Django's logging system. Configure logging in your settings:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/auto_checkout.log',
        },
    },
    'loggers': {
        'apps.bookings.tasks': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### Database Queries

To check auto-checkout statistics:

```sql
-- Count auto-checkouts today
SELECT COUNT(*) FROM bookings_booking 
WHERE auto_checkout = true 
AND DATE(actual_end_time) = CURRENT_DATE;

-- List recent auto-checkouts
SELECT booking_id, actual_start_time, actual_end_time, auto_checkout
FROM bookings_booking 
WHERE auto_checkout = true 
ORDER BY actual_end_time DESC 
LIMIT 10;
```

## Troubleshooting

### Common Issues

1. **Auto-checkout not running**: Check that your scheduled task is active
2. **Bookings not being checked out**: Verify the booking status is 'active' and `actual_start_time` is set
3. **Frontend not showing AUTO**: Ensure the API is returning the `auto_checkout` field

### Manual Cleanup

If you need to manually mark bookings as auto-checked out:

```python
from apps.bookings.models import Booking, BookingStatus
from django.utils import timezone
from datetime import timedelta

# Find bookings that should be auto-checked out
booking = Booking.objects.get(booking_id='BK12345678')
checkout_time = booking.actual_start_time + timedelta(hours=1)
booking.actual_end_time = checkout_time
booking.auto_checkout = True
booking.status = BookingStatus.COMPLETED
booking.save()
```

## Configuration

You can adjust the auto-checkout time by modifying the `timedelta(hours=1)` in:
- `backend/apps/bookings/management/commands/auto_checkout.py`
- `backend/apps/bookings/tasks.py`

Currently set to 1 hour as requested.