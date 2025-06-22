"""
Celery configuration for Parking in a Pinch project.
"""
import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('parking_pinch')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat configuration for periodic tasks
app.conf.beat_schedule = {
    'process-checkin-reminders-every-minute': {
        'task': 'apps.bookings.tasks.process_checkin_reminders',
        'schedule': 60.0,  # Run every 60 seconds to catch bookings starting soon
    },
    'process-expiration-warnings-every-5-minutes': {
        'task': 'apps.bookings.tasks.process_expiration_warnings',
        'schedule': 300.0,  # Run every 5 minutes to catch bookings expiring soon
    },
}
app.conf.timezone = settings.TIME_ZONE

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')