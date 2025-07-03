"""
URL configuration for admin dashboard endpoints.
"""
from django.urls import path
from . import views

app_name = 'admin_dashboard'

urlpatterns = [
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    path('disputes/', views.disputes_admin, name='disputes-admin'),
]