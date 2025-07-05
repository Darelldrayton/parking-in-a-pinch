"""
URL configuration for admin dashboard endpoints.
"""
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from . import views

app_name = 'admin_dashboard'

@csrf_exempt
def auth_debug(request):
    """Debug authentication issues"""
    return JsonResponse({
        'authenticated': request.user.is_authenticated,
        'user_id': request.user.id if request.user.is_authenticated else None,
        'is_staff': request.user.is_staff if request.user.is_authenticated else False,
        'is_superuser': request.user.is_superuser if request.user.is_authenticated else False,
        'email': request.user.email if request.user.is_authenticated else None,
        'auth_header': request.META.get('HTTP_AUTHORIZATION', 'No auth header'),
        'method': request.method,
    })

urlpatterns = [
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    path('disputes/', views.disputes_admin, name='disputes-admin'),
    path('auth-debug/', auth_debug, name='auth-debug'),
    path('debug-database/', views.debug_database, name='debug-database'),
]