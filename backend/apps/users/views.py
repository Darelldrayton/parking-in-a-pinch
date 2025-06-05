"""
Views for the users app.
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import UserProfile
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    UserListSerializer, UserPublicSerializer, UserProfileSerializer
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
            permission_classes = [permissions.AllowAny]
        elif self.action in ['list', 'public_profile']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
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
        user = request.user
        
        if request.method == 'GET':
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = UserUpdateSerializer(user, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(UserSerializer(user).data)
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
        total_bookings = user.bookings_as_guest.count()
        total_listings = user.listings.count()
        
        # Count reviews
        reviews_given = user.reviews_given.count()
        reviews_received = user.reviews_received.count()
        
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