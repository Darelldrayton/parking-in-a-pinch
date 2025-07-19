"""
Signals for the reviews app - handles rating calculations and updates.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from django.contrib.contenttypes.models import ContentType

from .models import Review, ReviewVote, ReviewFlag, ReviewType, ReviewStatus
from apps.listings.models import ParkingListing
from apps.users.models import User


@receiver(post_save, sender=Review)
def update_ratings_on_review_save(sender, instance, created, **kwargs):
    """
    Update related object ratings when a review is saved.
    """
    # 🚨 Critical Success Notification: Send review notification to hosts
    if created and instance.status == ReviewStatus.APPROVED:
        send_review_received_notification(instance)
    
    # Only process approved reviews for rating calculations
    if instance.status != ReviewStatus.APPROVED:
        return
    
    if instance.review_type == ReviewType.LISTING:
        update_listing_ratings(instance.reviewed_object)
    elif instance.review_type == ReviewType.HOST:
        update_user_host_ratings(instance.reviewed_object)
    elif instance.review_type == ReviewType.RENTER:
        update_user_guest_ratings(instance.reviewed_object)


@receiver(post_delete, sender=Review)
def update_ratings_on_review_delete(sender, instance, **kwargs):
    """
    Update related object ratings when a review is deleted.
    """
    if instance.review_type == ReviewType.LISTING:
        update_listing_ratings(instance.reviewed_object)
    elif instance.review_type == ReviewType.HOST:
        update_user_host_ratings(instance.reviewed_object)
    elif instance.review_type == ReviewType.RENTER:
        update_user_guest_ratings(instance.reviewed_object)


@receiver(post_save, sender=ReviewVote)
def update_vote_counts_on_vote_save(sender, instance, created, **kwargs):
    """
    Update review vote counts when a vote is saved.
    """
    review = instance.review
    
    # Recalculate vote counts
    helpful_count = review.votes.filter(vote_type='helpful').count()
    unhelpful_count = review.votes.filter(vote_type='unhelpful').count()
    
    # Update review vote counts
    Review.objects.filter(id=review.id).update(
        helpful_votes=helpful_count,
        unhelpful_votes=unhelpful_count
    )


@receiver(post_delete, sender=ReviewVote)
def update_vote_counts_on_vote_delete(sender, instance, **kwargs):
    """
    Update review vote counts when a vote is deleted.
    """
    review = instance.review
    
    # Recalculate vote counts
    helpful_count = review.votes.filter(vote_type='helpful').count()
    unhelpful_count = review.votes.filter(vote_type='unhelpful').count()
    
    # Update review vote counts
    Review.objects.filter(id=review.id).update(
        helpful_votes=helpful_count,
        unhelpful_votes=unhelpful_count
    )


@receiver(post_save, sender=ReviewFlag)
def update_flag_count_on_flag_save(sender, instance, created, **kwargs):
    """
    Update review flag count when a flag is saved.
    """
    if created:
        review = instance.review
        flag_count = review.flags.count()
        
        # Update flag count
        Review.objects.filter(id=review.id).update(flagged_count=flag_count)
        
        # Auto-flag review if it has too many flags
        if flag_count >= 5 and review.status == ReviewStatus.APPROVED:
            Review.objects.filter(id=review.id).update(status=ReviewStatus.FLAGGED)


@receiver(post_delete, sender=ReviewFlag)
def update_flag_count_on_flag_delete(sender, instance, **kwargs):
    """
    Update review flag count when a flag is deleted.
    """
    review = instance.review
    flag_count = review.flags.count()
    
    # Update flag count
    Review.objects.filter(id=review.id).update(flagged_count=flag_count)


def update_listing_ratings(listing):
    """
    Update listing rating averages based on approved reviews.
    """
    if not isinstance(listing, ParkingListing):
        return
    
    # Get content type for listings
    listing_content_type = ContentType.objects.get_for_model(ParkingListing)
    
    # Get all approved listing reviews
    reviews = Review.objects.filter(
        content_type=listing_content_type,
        object_id=listing.id,
        review_type=ReviewType.LISTING,
        status=ReviewStatus.APPROVED
    )
    
    # Calculate averages
    aggregations = reviews.aggregate(
        avg_overall=Avg('overall_rating'),
        avg_cleanliness=Avg('cleanliness_rating'),
        avg_location=Avg('location_rating'),
        avg_value=Avg('value_rating'),
        avg_security=Avg('security_rating'),
        total_count=Count('id')
    )
    
    # Update listing
    update_data = {
        'rating_average': round(aggregations['avg_overall'] or 0, 2),
        'total_reviews': aggregations['total_count']
    }
    
    ParkingListing.objects.filter(id=listing.id).update(**update_data)


def update_user_host_ratings(user):
    """
    Update user's host rating averages based on approved reviews.
    """
    if not isinstance(user, User):
        return
    
    # Get content type for users
    user_content_type = ContentType.objects.get_for_model(User)
    
    # Get all approved host reviews
    reviews = Review.objects.filter(
        content_type=user_content_type,
        object_id=user.id,
        review_type=ReviewType.HOST,
        status=ReviewStatus.APPROVED
    )
    
    # Calculate averages
    aggregations = reviews.aggregate(
        avg_overall=Avg('overall_rating'),
        avg_communication=Avg('communication_rating'),
        total_count=Count('id')
    )
    
    # Update user
    update_data = {
        'average_rating_as_host': aggregations['avg_overall'],
        'total_reviews_as_host': aggregations['total_count']
    }
    
    User.objects.filter(id=user.id).update(**update_data)


def update_user_guest_ratings(user):
    """
    Update user's guest rating averages based on approved reviews.
    """
    if not isinstance(user, User):
        return
    
    # Get content type for users
    user_content_type = ContentType.objects.get_for_model(User)
    
    # Get all approved renter reviews
    reviews = Review.objects.filter(
        content_type=user_content_type,
        object_id=user.id,
        review_type=ReviewType.RENTER,
        status=ReviewStatus.APPROVED
    )
    
    # Calculate averages
    aggregations = reviews.aggregate(
        avg_overall=Avg('overall_rating'),
        avg_communication=Avg('communication_rating'),
        avg_reliability=Avg('reliability_rating'),
        total_count=Count('id')
    )
    
    # Update user
    update_data = {
        'average_rating_as_guest': aggregations['avg_overall'],
        'total_reviews_as_guest': aggregations['total_count']
    }
    
    User.objects.filter(id=user.id).update(**update_data)


def recalculate_all_ratings():
    """
    Utility function to recalculate all ratings.
    This can be used for data migration or maintenance.
    """
    # Recalculate all listing ratings
    for listing in ParkingListing.objects.all():
        update_listing_ratings(listing)
    
    # Recalculate all user ratings
    for user in User.objects.all():
        update_user_host_ratings(user)
        update_user_guest_ratings(user)
    
    # Recalculate all review vote counts
    for review in Review.objects.all():
        helpful_count = review.votes.filter(vote_type='helpful').count()
        unhelpful_count = review.votes.filter(vote_type='unhelpful').count()
        flag_count = review.flags.count()
        
        Review.objects.filter(id=review.id).update(
            helpful_votes=helpful_count,
            unhelpful_votes=unhelpful_count,
            flagged_count=flag_count
        )


def get_user_reputation_score(user):
    """
    Calculate a reputation score for a user based on their reviews.
    This is a composite score considering both host and guest reviews.
    """
    if not isinstance(user, User):
        return 0
    
    # Base scores
    host_score = 0
    guest_score = 0
    
    # Host reputation (average rating * review count weight)
    if user.total_reviews_as_host > 0 and user.average_rating_as_host:
        host_reviews_weight = min(user.total_reviews_as_host / 10, 1.0)  # Max weight at 10 reviews
        host_score = float(user.average_rating_as_host) * host_reviews_weight * 20  # Scale to 100
    
    # Guest reputation (average rating * review count weight)
    if user.total_reviews_as_guest > 0 and user.average_rating_as_guest:
        guest_reviews_weight = min(user.total_reviews_as_guest / 10, 1.0)  # Max weight at 10 reviews
        guest_score = float(user.average_rating_as_guest) * guest_reviews_weight * 20  # Scale to 100
    
    # Verification bonus
    verification_bonus = 0
    if user.is_fully_verified():
        verification_bonus = 10
    
    # Calculate weighted average
    total_reviews = user.total_reviews_as_host + user.total_reviews_as_guest
    if total_reviews > 0:
        host_weight = user.total_reviews_as_host / total_reviews
        guest_weight = user.total_reviews_as_guest / total_reviews
        
        final_score = (host_score * host_weight + guest_score * guest_weight) + verification_bonus
        return min(round(final_score, 1), 100)  # Cap at 100
    
    return verification_bonus


def get_listing_quality_score(listing):
    """
    Calculate a quality score for a listing based on reviews and other factors.
    """
    if not isinstance(listing, ParkingListing):
        return 0
    
    # Base score from average rating
    base_score = 0
    if listing.total_reviews > 0 and listing.rating_average:
        review_weight = min(listing.total_reviews / 20, 1.0)  # Max weight at 20 reviews
        base_score = float(listing.rating_average) * review_weight * 20  # Scale to 100
    
    # Host reputation bonus
    host_reputation = get_user_reputation_score(listing.host)
    host_bonus = host_reputation * 0.1  # 10% of host reputation
    
    # Amenities bonus
    amenity_count = sum([
        listing.is_covered,
        listing.has_ev_charging,
        listing.has_security
    ])
    amenity_bonus = amenity_count * 2.5  # Up to 7.5 points for amenities
    
    # Completeness bonus (photos, description, etc.)
    completeness_bonus = 0
    if listing.description:
        completeness_bonus += 2.5
    if listing.images.exists():
        completeness_bonus += 5
    if listing.instructions:
        completeness_bonus += 2.5
    
    total_score = base_score + host_bonus + amenity_bonus + completeness_bonus
    return min(round(total_score, 1), 100)  # Cap at 100


def send_review_received_notification(review):
    """
    Send review received notification to the host when they receive a new review.
    """
    try:
        # Import here to avoid circular imports
        from apps.notifications.services import NotificationService
        
        # Only send notifications for listing reviews (hosts receive these)
        if review.review_type != ReviewType.LISTING:
            return
        
        # Get the listing and host
        listing = review.reviewed_object
        if not isinstance(listing, ParkingListing):
            return
            
        host = listing.host
        reviewer = review.reviewer
        
        # Get the booking associated with this review (if any)
        booking = getattr(review, 'booking', None)
        
        context = {
            'host_name': host.get_full_name() or host.username,
            'rating': review.overall_rating,
            'reviewer_name': reviewer.get_full_name() or reviewer.username,
            'parking_space_title': listing.title,
            'review_title': review.title or '',
            'review_comment': review.comment[:100] + ('...' if len(review.comment) > 100 else ''),
            'booking_id': booking.booking_id if booking else '',
            'action_url': f'/reviews/{review.id}',
            'respond_url': f'/reviews/{review.id}/respond',
        }
        
        NotificationService.send_notification(
            user=host,
            template_type='REVIEW_RECEIVED',
            context=context,
            channels=['IN_APP', 'EMAIL']
        )
        
        print(f"✅ Sent review received notification to host {host.email}")
        
    except Exception as e:
        print(f"❌ Error sending review received notification: {str(e)}")
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error sending review received notification: {str(e)}")