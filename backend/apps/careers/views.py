from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import HttpResponse
from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import csv
import io

from .models import JobApplication
from .serializers import (
    JobApplicationSerializer,
    JobApplicationCreateSerializer,
    JobApplicationUpdateSerializer,
    JobApplicationStatsSerializer,
    BulkStatusUpdateSerializer
)


class JobApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing job applications.
    """
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'department', 'experience_level']
    search_fields = ['name', 'email', 'position']
    ordering_fields = ['applied_date', 'name', 'status']
    ordering = ['-applied_date']
    
    def get_permissions(self):
        """
        Instantiate and return the list of permissions required for this view.
        """
        if self.action == 'create':
            # Allow anyone to submit job applications
            permission_classes = [AllowAny]
        else:
            # Require authentication for viewing/managing applications
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """
        Return the serializer class to use.
        """
        if self.action == 'create':
            return JobApplicationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return JobApplicationUpdateSerializer
        return JobApplicationSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new job application.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set default values
        validated_data = serializer.validated_data
        validated_data['status'] = JobApplication.ApplicationStatus.NEW
        
        application = serializer.save()
        
        # Return the created application
        response_serializer = JobApplicationSerializer(application)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get job application statistics.
        """
        stats = {
            'total': JobApplication.objects.count(),
            'new': JobApplication.objects.filter(status=JobApplication.ApplicationStatus.NEW).count(),
            'reviewing': JobApplication.objects.filter(status=JobApplication.ApplicationStatus.REVIEWING).count(),
            'interview': JobApplication.objects.filter(status=JobApplication.ApplicationStatus.INTERVIEW).count(),
            'hired': JobApplication.objects.filter(status=JobApplication.ApplicationStatus.HIRED).count(),
            'rejected': JobApplication.objects.filter(status=JobApplication.ApplicationStatus.REJECTED).count(),
        }
        
        serializer = JobApplicationStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """
        Export job applications to CSV.
        """
        applications = self.filter_queryset(self.get_queryset())
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="job_applications_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Name',
            'Email',
            'Phone',
            'Position',
            'Department',
            'Applied Date',
            'Status',
            'Experience Level',
            'Location',
            'Rating',
            'LinkedIn',
            'Portfolio',
            'Cover Letter'
        ])
        
        for app in applications:
            writer.writerow([
                app.name,
                app.email,
                app.phone,
                app.position,
                app.department,
                app.applied_date.strftime('%Y-%m-%d %H:%M:%S'),
                app.get_status_display(),
                app.get_experience_level_display() if app.experience_level else '',
                app.location,
                app.rating,
                app.linkedin,
                app.portfolio,
                app.cover_letter[:100] + '...' if len(app.cover_letter) > 100 else app.cover_letter
            ])
        
        return response
    
    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        """
        Bulk update the status of multiple applications.
        """
        serializer = BulkStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        application_ids = serializer.validated_data['application_ids']
        new_status = serializer.validated_data['status']
        
        # Update applications
        applications = JobApplication.objects.filter(id__in=application_ids)
        updated_count = applications.update(
            status=new_status,
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        
        return Response({
            'updated_count': updated_count,
            'status': new_status
        })
    
    @action(detail=True, methods=['patch'])
    def update_rating(self, request, pk=None):
        """
        Update the rating of a specific application.
        """
        application = self.get_object()
        rating = request.data.get('rating')
        
        if rating is None:
            return Response({'error': 'Rating is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rating = int(rating)
            if rating < 0 or rating > 5:
                return Response({'error': 'Rating must be between 0 and 5'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Rating must be a number'}, status=status.HTTP_400_BAD_REQUEST)
        
        application.rating = rating
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()
        
        serializer = JobApplicationSerializer(application)
        return Response(serializer.data)