"""
Serializers for dispute models.
"""
from rest_framework import serializers
from .models import Dispute, DisputeMessage, DisputeAttachment
from apps.users.models import User
from apps.bookings.models import Booking


class DisputeMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for dispute messages.
    """
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    
    class Meta:
        model = DisputeMessage
        fields = [
            'id', 'sender', 'sender_name', 'sender_email', 'message', 'is_internal', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at']


class DisputeAttachmentSerializer(serializers.ModelSerializer):
    """
    Serializer for dispute attachments.
    """
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DisputeAttachment
        fields = [
            'id', 'uploaded_by', 'uploaded_by_name', 'file', 'file_url', 
            'filename', 'description', 'created_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class DisputeSerializer(serializers.ModelSerializer):
    """
    Serializer for disputes.
    """
    complainant_name = serializers.CharField(source='complainant.get_full_name', read_only=True)
    complainant_email = serializers.CharField(source='complainant.email', read_only=True)
    respondent_name = serializers.CharField(source='respondent.get_full_name', read_only=True)
    respondent_email = serializers.CharField(source='respondent.email', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    booking_details = serializers.SerializerMethodField()
    messages = DisputeMessageSerializer(many=True, read_only=True)
    attachments = DisputeAttachmentSerializer(many=True, read_only=True)
    dispute_type_display = serializers.CharField(source='get_dispute_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    # Admin-friendly aliases
    filed_by = serializers.IntegerField(source='complainant.id', read_only=True)
    filed_by_username = serializers.CharField(source='complainant.username', read_only=True)
    filed_by_email = serializers.CharField(source='complainant.email', read_only=True)
    filed_at = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'dispute_id', 'complainant', 'complainant_name', 'complainant_email',
            'respondent', 'respondent_name', 'respondent_email', 'dispute_type', 
            'dispute_type_display', 'subject', 'description', 'booking', 'booking_details',
            'status', 'status_display', 'priority', 'priority_display', 'disputed_amount',
            'refund_requested', 'refund_amount', 'assigned_to', 'assigned_to_name',
            'admin_notes', 'resolution', 'created_at', 'updated_at', 'resolved_at',
            'messages', 'attachments', 'is_open', 'is_resolved',
            'filed_by', 'filed_by_username', 'filed_by_email', 'filed_at'
        ]
        read_only_fields = [
            'id', 'dispute_id', 'complainant', 'created_at', 'updated_at', 
            'resolved_at', 'is_open', 'is_resolved'
        ]
    
    def get_booking_details(self, obj):
        if obj.booking:
            return {
                'id': obj.booking.id,
                'booking_id': obj.booking.booking_id,
                'start_time': obj.booking.start_time,
                'end_time': obj.booking.end_time,
                'total_amount': str(obj.booking.total_amount),
                'status': obj.booking.status,
                'parking_space_title': obj.booking.parking_space.title if obj.booking.parking_space else None
            }
        return None


class CreateDisputeSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new disputes.
    """
    booking_id = serializers.CharField(required=False, write_only=True)
    respondent_email = serializers.EmailField(required=False, write_only=True)
    
    class Meta:
        model = Dispute
        fields = [
            'dispute_type', 'subject', 'description', 'booking_id', 
            'respondent_email', 'disputed_amount', 'refund_requested', 
            'refund_amount', 'priority'
        ]
    
    def validate(self, data):
        # If refund is requested, amount should be provided
        if data.get('refund_requested') and not data.get('refund_amount'):
            raise serializers.ValidationError(
                "Refund amount is required when requesting a refund."
            )
        return data
    
    def create(self, validated_data):
        booking_id = validated_data.pop('booking_id', None)
        respondent_email = validated_data.pop('respondent_email', None)
        
        # Note: complainant will be set in the view's perform_create method
        # to handle authentication-disabled state
        
        # Find booking if provided
        if booking_id:
            try:
                booking = Booking.objects.get(booking_id=booking_id)
                validated_data['booking'] = booking
                
                # If no respondent specified, try to infer from booking
                if not respondent_email:
                    if validated_data['dispute_type'] == Dispute.DisputeType.HOST_ISSUE:
                        validated_data['respondent'] = booking.parking_space.host
                    elif validated_data['dispute_type'] == Dispute.DisputeType.RENTER_ISSUE:
                        validated_data['respondent'] = booking.user
            except Booking.DoesNotExist:
                raise serializers.ValidationError("Booking not found.")
        
        # Find respondent by email if provided
        if respondent_email:
            try:
                respondent = User.objects.get(email=respondent_email)
                validated_data['respondent'] = respondent
            except User.DoesNotExist:
                raise serializers.ValidationError("User with this email not found.")
        
        return super().create(validated_data)


class AdminDisputeSerializer(serializers.ModelSerializer):
    """
    Admin serializer for managing disputes.
    """
    complainant_name = serializers.CharField(source='complainant.get_full_name', read_only=True)
    complainant_email = serializers.CharField(source='complainant.email', read_only=True)
    respondent_name = serializers.CharField(source='respondent.get_full_name', read_only=True)
    respondent_email = serializers.CharField(source='respondent.email', read_only=True)
    booking_details = serializers.SerializerMethodField()
    dispute_type_display = serializers.CharField(source='get_dispute_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'dispute_id', 'complainant', 'complainant_name', 'complainant_email',
            'respondent', 'respondent_name', 'respondent_email', 'dispute_type', 
            'dispute_type_display', 'subject', 'description', 'booking', 'booking_details',
            'status', 'status_display', 'priority', 'priority_display', 'disputed_amount',
            'refund_requested', 'refund_amount', 'assigned_to', 'admin_notes', 
            'resolution', 'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'dispute_id', 'complainant', 'created_at', 'updated_at']
    
    def get_booking_details(self, obj):
        if obj.booking:
            return {
                'id': obj.booking.id,
                'booking_id': obj.booking.booking_id,
                'start_time': obj.booking.start_time,
                'end_time': obj.booking.end_time,
                'total_amount': str(obj.booking.total_amount),
                'status': obj.booking.status,
                'parking_space_title': obj.booking.parking_space.title if obj.booking.parking_space else None
            }
        return None
    
    def get_can_be_resolved(self, obj):
        """Check if dispute can be resolved (is open or in review)."""
        return obj.status in [Dispute.DisputeStatus.OPEN, Dispute.DisputeStatus.IN_REVIEW]