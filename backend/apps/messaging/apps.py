"""
Django app configuration for the messaging app.
"""
from django.apps import AppConfig


class MessagingConfig(AppConfig):
    """
    Configuration for the messaging app.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.messaging'
    verbose_name = 'Messaging'
    
    def ready(self):
        """
        Import signals when the app is ready.
        """
        import apps.messaging.signals  # noqa