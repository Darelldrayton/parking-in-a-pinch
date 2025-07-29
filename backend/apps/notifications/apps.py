from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'Notifications'
    
    def ready(self):
        """Initialize email signals when the app is ready"""
        try:
            from .email_signals import setup_all_email_signals
            setup_all_email_signals()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not setup email signals: {str(e)}")