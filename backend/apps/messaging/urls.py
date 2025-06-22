"""
URL patterns for the messaging app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, MessageViewSet, MessageAttachmentViewSet

app_name = 'messaging'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversations')
router.register(r'', MessageViewSet, basename='messages')  # Register at root to avoid /messages/messages/
router.register(r'attachments', MessageAttachmentViewSet, basename='attachments')

urlpatterns = [
    path('', include(router.urls)),
]