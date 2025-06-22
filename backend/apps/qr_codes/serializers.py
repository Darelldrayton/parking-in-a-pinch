"""
QR Code Serializers
"""
from rest_framework import serializers
from .models import QRCode, QRCodeTemplate, QRCodeBatch, QRCodeUsage, QRCodeType


class QRCodeSerializer(serializers.ModelSerializer):
    """Serializer for QR Code model"""
    
    class Meta:
        model = QRCode
        fields = [
            'id', 'token', 'qr_type', 'status', 'data', 'verification_url',
            'single_use', 'max_uses', 'current_uses', 'expires_at',
            'location_restricted', 'generated_at', 'first_used_at', 'last_used_at'
        ]
        read_only_fields = ['id', 'token', 'verification_url', 'generated_at']


class QRCodeCreateSerializer(serializers.Serializer):
    """Serializer for creating QR codes"""
    
    qr_type = serializers.ChoiceField(choices=QRCodeType.choices)
    booking_id = serializers.UUIDField(required=False, allow_null=True)
    listing_id = serializers.UUIDField(required=False, allow_null=True)
    expiry_hours = serializers.IntegerField(default=24, min_value=1, max_value=8760)
    location_restricted = serializers.BooleanField(default=False)
    template_name = serializers.CharField(required=False, allow_blank=True)


class QRCodeVerifySerializer(serializers.Serializer):
    """Serializer for verifying QR codes"""
    
    token = serializers.CharField(max_length=64)
    location = serializers.DictField(required=False)


class QRCodeTemplateSerializer(serializers.ModelSerializer):
    """Serializer for QR Code Template model"""
    
    class Meta:
        model = QRCodeTemplate
        fields = '__all__'


class QRCodeBatchSerializer(serializers.ModelSerializer):
    """Serializer for QR Code Batch model"""
    
    class Meta:
        model = QRCodeBatch
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at', 'started_at', 'completed_at']


class QRCodeUsageSerializer(serializers.ModelSerializer):
    """Serializer for QR Code Usage model"""
    
    class Meta:
        model = QRCodeUsage
        fields = '__all__'