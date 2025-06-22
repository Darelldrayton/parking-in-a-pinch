"""
QR Codes URLs
"""
from django.urls import path
from . import api_views

app_name = 'qr_codes'

urlpatterns = [
    # QR Code generation
    path('generate/', api_views.generate_qr_code, name='generate_qr_code'),
    path('verify/', api_views.verify_qr_code, name='verify_qr_code'),
    path('info/<str:token>/', api_views.get_qr_info, name='get_qr_info'),
    
    # User QR codes
    path('my-codes/', api_views.get_user_qr_codes, name='get_user_qr_codes'),
    path('<uuid:qr_code_id>/revoke/', api_views.revoke_qr_code, name='revoke_qr_code'),
    path('<uuid:qr_code_id>/usage/', api_views.qr_code_usage_log, name='qr_code_usage_log'),
    
    # Templates and batches
    path('templates/', api_views.qr_templates, name='qr_templates'),
    path('batches/create/', api_views.create_qr_batch, name='create_qr_batch'),
    path('batches/', api_views.get_qr_batches, name='get_qr_batches'),
    path('batches/<uuid:batch_id>/download/', api_views.download_qr_batch, name='download_qr_batch'),
    
    # Analytics
    path('analytics/', api_views.qr_analytics, name='qr_analytics'),
    
    # Booking-specific QR codes
    path('booking/<uuid:booking_id>/checkin/', api_views.generate_checkin_qr, name='generate_checkin_qr'),
    path('booking/<uuid:booking_id>/checkout/', api_views.generate_checkout_qr, name='generate_checkout_qr'),
]