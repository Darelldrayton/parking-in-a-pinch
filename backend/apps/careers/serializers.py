from rest_framework import serializers
from django.utils import timezone
from .models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for job applications.
    """
    resume_url = serializers.SerializerMethodField()
    applied_date = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = JobApplication
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'position',
            'department',
            'applied_date',
            'status',
            'experience_level',
            'location',
            'rating',
            'linkedin',
            'portfolio',
            'cover_letter',
            'resume',
            'resume_url',
            'reviewed_by',
            'reviewed_at',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['applied_date', 'created_at', 'updated_at']
    
    def get_resume_url(self, obj):
        """Get the URL for the resume file."""
        return obj.get_resume_url()


class JobApplicationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating job applications (from the careers page).
    """
    
    class Meta:
        model = JobApplication
        fields = [
            'name',
            'email',
            'phone',
            'position',
            'department',
            'experience_level',
            'location',
            'linkedin',
            'portfolio',
            'cover_letter',
            'resume',
        ]
    
    def create(self, validated_data):
        """Create a new job application."""
        return JobApplication.objects.create(**validated_data)


class JobApplicationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating job applications (admin only).
    """
    
    class Meta:
        model = JobApplication
        fields = [
            'status',
            'rating',
            'notes',
        ]
    
    def update(self, instance, validated_data):
        """Update job application with reviewer information."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            instance.reviewed_by = request.user
            instance.reviewed_at = timezone.now()
        
        return super().update(instance, validated_data)


class JobApplicationStatsSerializer(serializers.Serializer):
    """
    Serializer for job application statistics.
    """
    total = serializers.IntegerField()
    new = serializers.IntegerField()
    reviewing = serializers.IntegerField()
    interview = serializers.IntegerField()
    hired = serializers.IntegerField()
    rejected = serializers.IntegerField()


class BulkStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for bulk status updates.
    """
    application_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
    status = serializers.ChoiceField(choices=JobApplication.ApplicationStatus.choices)