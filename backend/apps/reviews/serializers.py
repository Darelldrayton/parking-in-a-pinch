"""
Serializers for the reviews app.
"""
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db import transaction
from .models import (
    Review, ReviewImage, ReviewVote, ReviewFlag, ReviewTemplate,
    ReviewType, ReviewStatus
)
from apps.bookings.models import Booking, BookingStatus
from apps.listings.models import ParkingListing
from apps.users.models import User


class ReviewImageSerializer(serializers.ModelSerializer):
    """Serializer for review images."""
    image_url = serializers.ReadOnlyField()
    
    class Meta:
        model = ReviewImage
        fields = [
            'id', 'image', 'image_url', 'alt_text', 'display_order',
            'is_approved', 'uploaded_at'
        ]
        read_only_fields = ['id', 'is_approved', 'uploaded_at']


class ReviewVoteSerializer(serializers.ModelSerializer):
    """Serializer for review votes."""
    voter_name = serializers.CharField(source='voter.get_display_name', read_only=True)
    
    class Meta:
        model = ReviewVote
        fields = ['id', 'vote_type', 'voter_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReviewFlagSerializer(serializers.ModelSerializer):
    """Serializer for review flags."""
    flagger_name = serializers.CharField(source='flagger.get_display_name', read_only=True)
    
    class Meta:
        model = ReviewFlag
        fields = [
            'id', 'reason', 'description', 'flagger_name',
            'is_resolved', 'created_at'
        ]
        read_only_fields = ['id', 'flagger_name', 'is_resolved', 'created_at']


class ReviewTemplateSerializer(serializers.ModelSerializer):
    """Serializer for review templates."""
    
    class Meta:
        model = ReviewTemplate
        fields = [
            'id', 'name', 'review_type', 'template_type',
            'title_template', 'comment_template', 'suggested_rating',
            'usage_count'
        ]
        read_only_fields = ['id', 'usage_count']


class ReviewSerializer(serializers.ModelSerializer):
    """Main serializer for reviews."""
    
    reviewer_name = serializers.SerializerMethodField()
    reviewer_avatar = serializers.SerializerMethodField()
    images = ReviewImageSerializer(many=True, read_only=True)
    helpful_score = serializers.ReadOnlyField()
    total_votes = serializers.ReadOnlyField()
    helpful_percentage = serializers.ReadOnlyField()
    can_edit = serializers.SerializerMethodField()
    can_respond = serializers.SerializerMethodField()
    can_vote = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    
    # Object being reviewed details
    reviewed_object_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'review_id', 'reviewer', 'reviewer_name', 'reviewer_avatar',
            'review_type', 'booking', 'overall_rating', 'cleanliness_rating',
            'location_rating', 'value_rating', 'communication_rating',
            'security_rating', 'reliability_rating', 'title', 'comment',
            'is_anonymous', 'status', 'is_verified', 'helpful_votes',
            'unhelpful_votes', 'helpful_score', 'total_votes',
            'helpful_percentage', 'response_text', 'response_date',
            'created_at', 'updated_at', 'published_at', 'images',
            'can_edit', 'can_respond', 'can_vote', 'user_vote',
            'reviewed_object_details'
        ]
        read_only_fields = [
            'id', 'review_id', 'helpful_votes', 'unhelpful_votes',
            'created_at', 'updated_at', 'published_at', 'is_verified'
        ]
    
    def get_reviewer_name(self, obj):
        """Get reviewer name, handling anonymous reviews."""
        if obj.is_anonymous:
            return "Anonymous User"
        return obj.reviewer.get_display_name()
    
    def get_reviewer_avatar(self, obj):
        """Get reviewer avatar URL, handling cases with no profile picture."""
        if obj.is_anonymous or not obj.reviewer.profile_picture:
            return None
        try:
            return obj.reviewer.profile_picture.url
        except (ValueError, AttributeError):
            return None
    
    def get_can_edit(self, obj):
        """Check if current user can edit this review."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_be_edited_by(request.user)
    
    def get_can_respond(self, obj):
        """Check if current user can respond to this review."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_respond(request.user)
    
    def get_can_vote(self, obj):
        """Check if current user can vote on this review."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Can't vote on own review
        if obj.reviewer == request.user:
            return False
        return True
    
    def get_user_vote(self, obj):
        """Get current user's vote on this review."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        vote = obj.votes.filter(voter=request.user).first()
        return vote.vote_type if vote else None
    
    def get_reviewed_object_details(self, obj):
        """Get details about the object being reviewed."""
        if obj.review_type == ReviewType.LISTING:
            if isinstance(obj.reviewed_object, ParkingListing):
                return {
                    'id': obj.reviewed_object.id,
                    'title': obj.reviewed_object.title,
                    'address': obj.reviewed_object.address,
                    'type': 'listing'
                }
        elif obj.review_type in [ReviewType.RENTER, ReviewType.HOST]:
            if isinstance(obj.reviewed_object, User):
                return {
                    'id': obj.reviewed_object.id,
                    'name': obj.reviewed_object.get_display_name(),
                    'type': obj.review_type.lower()
                }
        return None


class CreateReviewSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews."""
    
    # Fields to help identify what's being reviewed
    listing_id = serializers.IntegerField(write_only=True, required=False)
    user_id = serializers.IntegerField(write_only=True, required=False)
    booking_id = serializers.CharField(write_only=True, required=False)
    
    # Image uploads
    image_files = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        max_length=5  # Max 5 images per review
    )
    
    class Meta:
        model = Review
        fields = [
            'review_type', 'booking_id', 'listing_id', 'user_id',
            'overall_rating', 'cleanliness_rating', 'location_rating',
            'value_rating', 'communication_rating', 'security_rating',
            'reliability_rating', 'title', 'comment', 'is_anonymous',
            'image_files'
        ]
    
    def validate(self, data):
        """Validate review creation data."""
        review_type = data.get('review_type')
        booking_id = data.get('booking_id')
        listing_id = data.get('listing_id')
        user_id = data.get('user_id')
        
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
        
        reviewer = request.user
        
        # Validate based on review type
        if review_type == ReviewType.LISTING:
            if not listing_id:
                raise serializers.ValidationError("listing_id is required for listing reviews.")
            
            try:
                listing = ParkingListing.objects.get(id=listing_id)
                data['reviewed_object'] = listing
            except ParkingListing.DoesNotExist:
                raise serializers.ValidationError("Listing not found.")
            
            # Must have booking to review listing
            if booking_id:
                try:
                    booking = Booking.objects.get(
                        booking_id=booking_id,
                        user=reviewer,
                        parking_space=listing,
                        status=BookingStatus.COMPLETED
                    )
                    data['booking_instance'] = booking
                    data['is_verified'] = True
                except Booking.DoesNotExist:
                    raise serializers.ValidationError(
                        "You can only review listings after completing a booking."
                    )
        
        elif review_type in [ReviewType.RENTER, ReviewType.HOST]:
            if not user_id:
                raise serializers.ValidationError("user_id is required for user reviews.")
            if not booking_id:
                raise serializers.ValidationError("booking_id is required for user reviews.")
            
            try:
                reviewed_user = User.objects.get(id=user_id)
                data['reviewed_object'] = reviewed_user
            except User.DoesNotExist:
                raise serializers.ValidationError("User not found.")
            
            try:
                booking = Booking.objects.get(
                    booking_id=booking_id,
                    status=BookingStatus.COMPLETED
                )
                
                # Validate reviewer relationship to booking
                if review_type == ReviewType.RENTER:
                    # Host reviewing renter
                    if booking.parking_space.host != reviewer:
                        raise serializers.ValidationError(
                            "You can only review renters for your own listings."
                        )
                    if booking.user != reviewed_user:
                        raise serializers.ValidationError("Invalid renter for this booking.")
                
                elif review_type == ReviewType.HOST:
                    # Renter reviewing host
                    if booking.user != reviewer:
                        raise serializers.ValidationError(
                            "You can only review hosts for your own bookings."
                        )
                    if booking.parking_space.host != reviewed_user:
                        raise serializers.ValidationError("Invalid host for this booking.")
                
                data['booking_instance'] = booking
                data['is_verified'] = True
                
            except Booking.DoesNotExist:
                raise serializers.ValidationError("Booking not found or not completed.")
        
        else:
            raise serializers.ValidationError("Invalid review type.")
        
        # Check for duplicate reviews
        existing_review = Review.objects.filter(
            reviewer=reviewer,
            booking=data.get('booking_instance'),
            review_type=review_type
        ).first()
        
        if existing_review:
            raise serializers.ValidationError(
                "You have already reviewed this booking with this review type."
            )
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create review with images."""
        # Extract non-model fields
        image_files = validated_data.pop('image_files', [])
        booking_instance = validated_data.pop('booking_instance', None)
        reviewed_object = validated_data.pop('reviewed_object')
        
        # Remove write-only fields
        validated_data.pop('listing_id', None)
        validated_data.pop('user_id', None)
        validated_data.pop('booking_id', None)
        
        # Set up generic foreign key
        validated_data['content_type'] = ContentType.objects.get_for_model(reviewed_object)
        validated_data['object_id'] = reviewed_object.id
        validated_data['booking'] = booking_instance
        validated_data['reviewer'] = self.context['request'].user
        validated_data['status'] = ReviewStatus.APPROVED  # Auto-approve for now
        validated_data['published_at'] = timezone.now()
        
        # Create review
        review = Review.objects.create(**validated_data)
        
        # Create images
        for i, image_file in enumerate(image_files):
            ReviewImage.objects.create(
                review=review,
                image=image_file,
                display_order=i,
                is_approved=True  # Auto-approve for now
            )
        
        return review


class ReviewResponseSerializer(serializers.Serializer):
    """Serializer for adding responses to reviews."""
    response_text = serializers.CharField(max_length=1000)
    
    def validate_response_text(self, value):
        """Validate response text."""
        if not value.strip():
            raise serializers.ValidationError("Response cannot be empty.")
        return value.strip()
    
    def update(self, instance, validated_data):
        """Add response to review."""
        instance.response_text = validated_data['response_text']
        instance.response_date = timezone.now()
        instance.save(update_fields=['response_text', 'response_date'])
        return instance


class ReviewVoteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating review votes."""
    
    class Meta:
        model = ReviewVote
        fields = ['vote_type']
    
    def validate(self, data):
        """Validate vote creation."""
        request = self.context.get('request')
        review = self.context.get('review')
        
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
        
        if not review:
            raise serializers.ValidationError("Review context required.")
        
        # Can't vote on own review
        if review.reviewer == request.user:
            raise serializers.ValidationError("You cannot vote on your own review.")
        
        return data
    
    def create(self, validated_data):
        """Create or update vote."""
        review = self.context['review']
        voter = self.context['request'].user
        
        # Update existing vote or create new one
        vote, created = ReviewVote.objects.update_or_create(
            review=review,
            voter=voter,
            defaults={'vote_type': validated_data['vote_type']}
        )
        
        return vote


class ReviewFlagCreateSerializer(serializers.ModelSerializer):
    """Serializer for flagging reviews."""
    
    class Meta:
        model = ReviewFlag
        fields = ['reason', 'description']
    
    def validate(self, data):
        """Validate flag creation."""
        request = self.context.get('request')
        review = self.context.get('review')
        
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
        
        if not review:
            raise serializers.ValidationError("Review context required.")
        
        # Check if user already flagged this review
        if ReviewFlag.objects.filter(review=review, flagger=request.user).exists():
            raise serializers.ValidationError("You have already flagged this review.")
        
        return data
    
    def create(self, validated_data):
        """Create flag."""
        review = self.context['review']
        flagger = self.context['request'].user
        
        flag = ReviewFlag.objects.create(
            review=review,
            flagger=flagger,
            **validated_data
        )
        
        return flag


class ReviewSummarySerializer(serializers.Serializer):
    """Serializer for review summaries and statistics."""
    
    total_reviews = serializers.IntegerField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    rating_distribution = serializers.DictField()
    recent_reviews = ReviewSerializer(many=True)
    
    # Detailed ratings (for listings)
    average_cleanliness = serializers.DecimalField(max_digits=3, decimal_places=2, required=False)
    average_location = serializers.DecimalField(max_digits=3, decimal_places=2, required=False)
    average_value = serializers.DecimalField(max_digits=3, decimal_places=2, required=False)
    average_security = serializers.DecimalField(max_digits=3, decimal_places=2, required=False)
    
    # User-specific ratings
    average_communication = serializers.DecimalField(max_digits=3, decimal_places=2, required=False)
    average_reliability = serializers.DecimalField(max_digits=3, decimal_places=2, required=False)