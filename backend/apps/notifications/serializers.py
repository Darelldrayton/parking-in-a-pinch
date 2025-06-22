"""
Notification Serializers
"""
from rest_framework import serializers
from .models import (
    Notification, NotificationTemplate, NotificationPreference,
    PushSubscription, NotificationChannel
)


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    time_ago = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    type = serializers.CharField(source='category', read_only=True)
    title = serializers.CharField(source='subject', read_only=True)
    message = serializers.CharField(source='content', read_only=True)
    action_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'channel', 'category', 'priority', 'subject', 'content',
            'status', 'recipient', 'created_at', 'sent_at', 'delivered_at',
            'read_at', 'time_ago', 'is_read', 'type', 'title', 'message', 'action_url'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_time_ago(self, obj):
        """Get human-readable time since notification was created"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"
        else:
            return obj.created_at.strftime('%m/%d/%Y')
    
    def get_is_read(self, obj):
        """Get whether notification has been read"""
        return obj.status == 'read'
    
    def get_action_url(self, obj):
        """Get action URL from metadata or variables"""
        if hasattr(obj, 'metadata') and obj.metadata:
            return obj.metadata.get('action_url')
        elif hasattr(obj, 'variables') and obj.variables:
            return obj.variables.get('action_url')
        return None


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for NotificationTemplate model"""
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'category', 'channel', 'subject_template',
            'content_template', 'html_template', 'variables', 'is_active',
            'priority', 'created_at', 'updated_at'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreference model"""
    
    class Meta:
        model = NotificationPreference
        fields = '__all__'
        read_only_fields = ['user']


class PushSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for PushSubscription model"""
    
    class Meta:
        model = PushSubscription
        fields = '__all__'
        read_only_fields = ['user']


class SendNotificationSerializer(serializers.Serializer):
    """Serializer for sending test notifications"""
    
    channel = serializers.ChoiceField(choices=NotificationChannel.choices)
    message = serializers.CharField(max_length=500)