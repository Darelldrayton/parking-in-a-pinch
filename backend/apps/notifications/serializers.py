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
    
    # Add frontend-compatible field names
    push_enabled = serializers.BooleanField(source='push_notifications', required=False)
    
    class Meta:
        model = NotificationPreference
        fields = '__all__'
        read_only_fields = ['user']
    
    def to_representation(self, instance):
        """Convert backend format to frontend-expected format"""
        data = super().to_representation(instance)
        
        # Add frontend-compatible fields
        data['push_enabled'] = data.get('push_notifications', True)
        
        # Convert category preferences to frontend format
        categories = {
            'bookingUpdates': data.get('booking_notifications', True),
            'paymentActivity': data.get('payment_notifications', True), 
            'messageNotifications': data.get('message_notifications', True),
            'timeReminders': data.get('reminder_notifications', True),
            'accountSecurity': data.get('system_notifications', True),
            'promotionalOffers': data.get('marketing_notifications', False),
            'systemUpdates': data.get('system_notifications', True),
            'hostNotifications': data.get('booking_notifications', True),
        }
        
        data['categories'] = categories
        
        return data


class NotificationPreferenceUpdateSerializer(serializers.ModelSerializer):
    """Specialized serializer for updating notification preferences from frontend"""
    
    # Frontend-compatible field names
    push_enabled = serializers.BooleanField(source='push_notifications', required=False)
    preferences = serializers.ListField(required=False, write_only=True)
    schedule = serializers.JSONField(required=False)
    sound = serializers.JSONField(required=False)
    vibration = serializers.JSONField(required=False)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'email_enabled', 'sms_enabled', 'push_enabled', 'push_notifications',
            'booking_notifications', 'payment_notifications', 'message_notifications',
            'reminder_notifications', 'emergency_notifications', 'marketing_notifications',
            'system_notifications', 'quiet_hours_enabled', 'quiet_hours_start',
            'quiet_hours_end', 'timezone', 'preferences', 'schedule', 'sound', 'vibration'
        ]
        read_only_fields = ['user']
    
    def update(self, instance, validated_data):
        """Handle frontend data structure when updating"""
        
        # Handle preferences array from frontend
        preferences_list = validated_data.pop('preferences', [])
        
        # Map frontend categories to backend fields
        field_mapping = {
            'bookingUpdates': 'booking_notifications',
            'paymentActivity': 'payment_notifications', 
            'messageNotifications': 'message_notifications',
            'timeReminders': 'reminder_notifications',
            'accountSecurity': 'system_notifications',
            'promotionalOffers': 'marketing_notifications',
            'systemUpdates': 'system_notifications',
            'hostNotifications': 'booking_notifications',
        }
        
        # Process preferences array
        for pref in preferences_list:
            if isinstance(pref, dict):
                notification_type = pref.get('notification_type')
                enabled = pref.get('enabled', True)
                
                if notification_type in field_mapping:
                    field_name = field_mapping[notification_type]
                    validated_data[field_name] = enabled
        
        # Handle schedule, sound, vibration (store as metadata if needed)
        # For now, we'll ignore these as they're not in the model
        validated_data.pop('schedule', None)
        validated_data.pop('sound', None) 
        validated_data.pop('vibration', None)
        
        # Update the instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


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