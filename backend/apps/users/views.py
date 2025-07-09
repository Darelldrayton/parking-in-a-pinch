"""
Views for the users app.
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from .models import UserProfile, VerificationRequest
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    UserListSerializer, UserPublicSerializer, UserProfileSerializer,
    FrontendUserSerializer, VerificationRequestSerializer,
    CreateVerificationRequestSerializer, AdminVerificationActionSerializer,
    AdminUserListSerializer
)

User = get_user_model()


class UserViewSet(ModelViewSet):
    """
    ViewSet for managing users.
    """
    queryset = User.objects.filter(is_deleted=False)
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'list':
            return UserListSerializer
        elif self.action == 'public_profile':
            return UserPublicSerializer
        return UserSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action == 'create':
            # Allow anyone to create an account
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_object(self):
        """Get user object, ensuring users can only access their own data."""
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            # For these actions, users can only access their own profile
            if self.kwargs.get('pk') == 'me':
                return self.request.user
            elif str(self.request.user.pk) == self.kwargs.get('pk'):
                return self.request.user
            else:
                # Staff users can access other user profiles
                if self.request.user.is_staff:
                    return get_object_or_404(self.get_queryset(), pk=self.kwargs['pk'])
                else:
                    return self.request.user
        return super().get_object()
    
    def perform_create(self, serializer):
        """Create a new user."""
        user = serializer.save()
        # Create associated profile
        UserProfile.objects.get_or_create(user=user)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def public_profile(self, request, pk=None):
        """Get public profile information for a user."""
        user = get_object_or_404(User.objects.filter(is_deleted=False), pk=pk)
        serializer = UserPublicSerializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current user's profile."""
        # TEMPORARY FIX: Handle case when authentication is disabled
        if not request.user.is_authenticated:
            # Try to get user from token manually
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Token '):
                token = auth_header.split(' ')[1]
                try:
                    # Use DRF Token authentication
                    from rest_framework.authtoken.models import Token
                    token_obj = Token.objects.get(key=token)
                    user = token_obj.user
                except Exception as e:
                    return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
            elif auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    from rest_framework_simplejwt.tokens import AccessToken
                    access_token = AccessToken(token)
                    user_id = access_token['user_id']
                    user = User.objects.get(id=user_id)
                except Exception as e:
                    return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            user = request.user
        
        if request.method == 'GET':
            serializer = FrontendUserSerializer(user, context={'request': request})
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            # Convert frontend user_type to backend format if provided
            if 'user_type' in request.data:
                type_mapping = {
                    'renter': 'SEEKER',
                    'host': 'HOST',
                    'both': 'BOTH'
                }
                request.data['user_type'] = type_mapping.get(request.data['user_type'], user.user_type)
            
            partial = request.method == 'PATCH'
            # Use UserUpdateSerializer for updates to handle vehicle fields
            serializer = UserUpdateSerializer(user, data=request.data, partial=partial, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                # Return updated user data using FrontendUserSerializer
                return Response(FrontendUserSerializer(user, context={'request': request}).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_email(self, request):
        """Verify user's email address."""
        # This would typically involve checking a verification token
        # For now, we'll just mark the email as verified
        user = request.user
        user.is_email_verified = True
        user.save()
        return Response({'message': 'Email verified successfully'})
    
    @action(detail=False, methods=['post'])
    def verify_phone(self, request):
        """Verify user's phone number."""
        # This would typically involve checking a verification code
        # For now, we'll just mark the phone as verified
        user = request.user
        user.is_phone_verified = True
        user.save()
        return Response({'message': 'Phone number verified successfully'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics."""
        user = request.user
        
        # Count user's bookings and listings
        total_bookings = user.bookings.count()
        total_listings = user.listings.count()
        
        # Count reviews
        reviews_given = user.reviews_given.count()
        # For reviews received, we need to count reviews where the user is the reviewed object
        # This would require filtering reviews based on the reviewed object
        reviews_received = 0  # TODO: Implement proper count for reviews received
        
        stats = {
            'total_bookings': total_bookings,
            'total_listings': total_listings,
            'reviews_given': reviews_given,
            'reviews_received': reviews_received,
            'average_rating_as_host': user.average_rating_as_host,
            'total_reviews_as_host': user.total_reviews_as_host,
            'average_rating_as_guest': user.average_rating_as_guest,
            'total_reviews_as_guest': user.total_reviews_as_guest,
            'is_verified': user.is_verified(),
            'verification_status': {
                'email': user.is_email_verified,
                'phone': user.is_phone_verified,
                'identity': user.is_identity_verified,
            }
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser], permission_classes=[permissions.IsAuthenticated])
    def upload_profile_photo(self, request):
        """Upload and update user's profile photo."""
        from .profile_photo_views import upload_profile_photo as upload_view
        return upload_view(request._request)
    
    @action(detail=False, methods=['delete'])
    def delete_profile_photo(self, request):
        """Delete user's profile photo."""
        from .profile_photo_views import delete_profile_photo as delete_view
        return delete_view(request)


class UserProfileViewSet(ModelViewSet):
    """
    ViewSet for managing user profiles.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return user's own profile."""
        return UserProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create profile for current user."""
        serializer.save(user=self.request.user)


class VerificationRequestViewSet(ModelViewSet):
    """
    ViewSet for managing verification requests.
    """
    queryset = VerificationRequest.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VerificationRequestSerializer
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        print(f"DEBUG: VerificationRequestViewSet action={self.action}")
        if self.action == 'create':
            return CreateVerificationRequestSerializer
        return VerificationRequestSerializer
    
    def get_queryset(self):
        """Return user's own verification requests."""
        if self.request.user.is_authenticated:
            return VerificationRequest.objects.filter(user=self.request.user)
        return VerificationRequest.objects.none()
    
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the latest verification request for each type."""
        latest_requests = {}
        for verification_type in VerificationRequest.VerificationType.values:
            latest = self.get_queryset().filter(
                verification_type=verification_type
            ).first()
            if latest:
                latest_requests[verification_type] = VerificationRequestSerializer(
                    latest, context={'request': request}
                ).data
        
        return Response(latest_requests)


class AdminVerificationViewSet(ModelViewSet):
    """
    Admin ViewSet for managing verification requests.
    """
    serializer_class = VerificationRequestSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """Return all verification requests for admin review."""
        queryset = VerificationRequest.objects.select_related(
            'user', 'reviewed_by'
        ).all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by verification type
        type_filter = self.request.query_params.get('type')
        if type_filter:
            queryset = queryset.filter(verification_type=type_filter)
        
        # Search by user name or email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Review a verification request (approve/reject/request_revision)."""
        verification_request = self.get_object()
        
        if not verification_request.can_be_reviewed():
            return Response(
                {'error': 'This verification request has already been reviewed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AdminVerificationActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        reason = serializer.validated_data.get('reason', '')
        
        if action == 'approve':
            verification_request.approve(request.user, notes)
            message = 'Verification request approved successfully'
        elif action == 'reject':
            verification_request.reject(request.user, reason, notes)
            message = 'Verification request rejected'
        elif action == 'request_revision':
            verification_request.request_revision(request.user, reason, notes)
            message = 'Revision requested'
        
        # Return updated verification request
        updated_request = VerificationRequestSerializer(
            verification_request, context={'request': request}
        )
        
        return Response({
            'message': message,
            'verification_request': updated_request.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get verification statistics for admin dashboard."""
        stats = {
            'pending_count': VerificationRequest.objects.filter(
                status=VerificationRequest.VerificationStatus.PENDING
            ).count(),
            'approved_today': VerificationRequest.objects.filter(
                status=VerificationRequest.VerificationStatus.APPROVED,
                reviewed_at__date=timezone.now().date()
            ).count(),
            'rejected_today': VerificationRequest.objects.filter(
                status=VerificationRequest.VerificationStatus.REJECTED,
                reviewed_at__date=timezone.now().date()
            ).count(),
            'total_verified_users': User.objects.filter(
                is_identity_verified=True
            ).count(),
            'total_users': User.objects.filter(is_active=True).count(),
        }
        
        # Get verification counts by type
        verification_counts = {}
        for verification_type in VerificationRequest.VerificationType.values:
            verification_counts[verification_type] = {
                'pending': VerificationRequest.objects.filter(
                    verification_type=verification_type,
                    status=VerificationRequest.VerificationStatus.PENDING
                ).count(),
                'approved': VerificationRequest.objects.filter(
                    verification_type=verification_type,
                    status=VerificationRequest.VerificationStatus.APPROVED
                ).count(),
                'rejected': VerificationRequest.objects.filter(
                    verification_type=verification_type,
                    status=VerificationRequest.VerificationStatus.REJECTED
                ).count(),
            }
        
        stats['by_type'] = verification_counts
        
        return Response(stats)


class AdminUserViewSet(ModelViewSet):
    """
    Admin ViewSet for managing users.
    """
    serializer_class = AdminUserListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return all users for admin management."""
        queryset = User.objects.filter(is_deleted=False).prefetch_related(
            'verification_requests'
        )
        
        # Filter by verification status
        verified_filter = self.request.query_params.get('verified')
        if verified_filter == 'true':
            queryset = queryset.filter(is_identity_verified=True)
        elif verified_filter == 'false':
            queryset = queryset.filter(is_identity_verified=False)
        
        # Search by name or email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def toggle_verification(self, request, pk=None):
        """Manually toggle user verification status."""
        user = self.get_object()
        verification_type = request.data.get('verification_type', 'identity')
        
        if verification_type == 'identity':
            user.is_identity_verified = not user.is_identity_verified
        elif verification_type == 'email':
            user.is_email_verified = not user.is_email_verified
        elif verification_type == 'phone':
            user.is_phone_verified = not user.is_phone_verified
        else:
            return Response(
                {'error': 'Invalid verification type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.save()
        
        return Response({
            'message': f'{verification_type.title()} verification toggled',
            'user': AdminUserListSerializer(user, context={'request': request}).data
        })