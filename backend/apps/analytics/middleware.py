"""
Analytics Middleware
"""
import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from .services import EventTracker, PerformanceAnalytics
from .models import EventType

User = get_user_model()
logger = logging.getLogger(__name__)


class AnalyticsMiddleware(MiddlewareMixin):
    """Middleware to automatically track page views and performance"""
    
    def process_request(self, request):
        """Start tracking request"""
        request._analytics_start_time = time.time()
        
        # Track page views for GET requests
        if request.method == 'GET' and not self._is_static_request(request):
            try:
                user = request.user if request.user.is_authenticated else None
                
                EventTracker.track_event(
                    event_type=EventType.PAGE_VIEW,
                    user=user,
                    event_data={
                        'path': request.path,
                        'method': request.method,
                        'query_params': dict(request.GET)
                    },
                    request=request
                )
            except Exception as e:
                logger.error(f"Error tracking page view: {str(e)}")
    
    def process_response(self, request, response):
        """Track performance metrics"""
        try:
            if hasattr(request, '_analytics_start_time'):
                response_time = (time.time() - request._analytics_start_time) * 1000  # Convert to milliseconds
                
                if not self._is_static_request(request):
                    user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
                    session_id = request.session.session_key if hasattr(request, 'session') else None
                    
                    PerformanceAnalytics.track_performance(
                        endpoint=request.path,
                        method=request.method,
                        response_time=response_time,
                        status_code=response.status_code,
                        user=user,
                        session_id=session_id,
                        request_size=len(request.body) if hasattr(request, 'body') else 0,
                        response_size=len(response.content) if hasattr(response, 'content') else 0
                    )
        except Exception as e:
            logger.error(f"Error tracking performance: {str(e)}")
        
        return response
    
    def _is_static_request(self, request):
        """Check if request is for static files"""
        static_paths = ['/static/', '/media/', '/favicon.ico', '/robots.txt']
        return any(request.path.startswith(path) for path in static_paths)


class UserSessionMiddleware(MiddlewareMixin):
    """Middleware to track user sessions"""
    
    def process_request(self, request):
        """Track session start/activity"""
        try:
            if hasattr(request, 'session') and request.session.session_key:
                session_id = request.session.session_key
                
                # Update session activity
                from .models import UserBehaviorSession
                
                if request.user.is_authenticated:
                    session, created = UserBehaviorSession.objects.get_or_create(
                        session_id=session_id,
                        defaults={
                            'user': request.user,
                            'ip_address': self._get_client_ip(request),
                            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                            'entry_page': request.build_absolute_uri(),
                            'referrer': request.META.get('HTTP_REFERER', '')
                        }
                    )
                    
                    if not created and not session.user:
                        # User logged in during session
                        session.user = request.user
                        session.save()
                    
                    # Store session reference for other middleware
                    request._analytics_session = session
        
        except Exception as e:
            logger.error(f"Error in session middleware: {str(e)}")
    
    def _get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ErrorTrackingMiddleware(MiddlewareMixin):
    """Middleware to track application errors"""
    
    def process_exception(self, request, exception):
        """Track errors that occur during request processing"""
        try:
            user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
            
            EventTracker.track_event(
                event_type=EventType.ERROR_OCCURRED,
                user=user,
                event_data={
                    'error_type': type(exception).__name__,
                    'error_message': str(exception),
                    'path': request.path,
                    'method': request.method,
                    'status_code': 500
                },
                request=request
            )
        except Exception as e:
            logger.error(f"Error tracking exception: {str(e)}")
        
        return None  # Let other exception handling continue