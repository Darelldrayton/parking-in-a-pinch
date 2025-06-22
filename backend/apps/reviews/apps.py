"""
Reviews app configuration for Parking in a Pinch.
"""
from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reviews'
    verbose_name = 'Reviews and Ratings'
    
    def ready(self):
        """Import signals when app is ready."""
        import apps.reviews.signals