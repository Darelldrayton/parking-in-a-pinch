from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Booking, BookingReview, BookingStatus


class BookingSerializer(serializers.ModelSerializer):
    parking_space_title = serializers.CharField(source='parking_space.title', read_only=True)
    parking_space_address = serializers.CharField(source='parking_space.address', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    is_active = serializers.ReadOnlyField()
    can_be_cancelled = serializers.ReadOnlyField()
    time_until_start = serializers.ReadOnlyField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_id', 'user', 'user_name', 'user_email',
            'parking_space', 'parking_space_title', 'parking_space_address',
            'start_time', 'end_time', 'duration_hours',
            'hourly_rate', 'total_amount', 'platform_fee',
            'status', 'special_instructions',
            'vehicle_license_plate', 'vehicle_state',
            'created_at', 'updated_at', 'confirmed_at',
            'actual_start_time', 'actual_end_time', 'auto_checkout',
            'is_active', 'can_be_cancelled', 'time_until_start'
        ]
        read_only_fields = [
            'id', 'booking_id', 'duration_hours', 'total_amount', 'platform_fee',
            'created_at', 'updated_at', 'confirmed_at', 'actual_start_time', 'actual_end_time', 'auto_checkout'
        ]


class CreateBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'parking_space', 'start_time', 'end_time', 
            'vehicle_license_plate', 'vehicle_state', 'special_instructions'
        ]
    
    def validate(self, data):
        start_time = data['start_time']
        end_time = data['end_time']
        parking_space = data['parking_space']
        
        # Validate time range
        if start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time.")
        
        # Validate start time is in the future (allow 1 minute grace period for network delays)
        grace_period = timezone.timedelta(minutes=1)
        if start_time <= timezone.now() - grace_period:
            raise serializers.ValidationError("Start time must be in the future.")
        
        # Check maximum booking duration (e.g., 7 days)
        max_duration = timezone.timedelta(days=7)
        if end_time - start_time > max_duration:
            raise serializers.ValidationError("Booking duration cannot exceed 7 days.")
        
        # Check for overlapping bookings (including PENDING to prevent race conditions)
        # PENDING bookings are included because they might be confirmed soon
        # Only exclude CANCELLED and NO_SHOW bookings
        overlapping = Booking.objects.filter(
            parking_space=parking_space,
            status__in=[BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()
        
        if overlapping:
            raise serializers.ValidationError(
                "This parking space is not available for the selected time period. "
                "There may be pending or confirmed bookings that conflict with your request."
            )
        
        # Additional validation: Check against parking space availability schedule
        if hasattr(parking_space, 'availability_schedule') and parking_space.availability_schedule:
            self._validate_against_schedule(start_time, end_time, parking_space.availability_schedule)
        
        return data
    
    def _validate_against_schedule(self, start_time, end_time, availability_schedule):
        """Validate booking times against parking space availability schedule"""
        from datetime import datetime, time
        import pytz
        from django.conf import settings
        
        # Get day names mapping
        day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        # Get the local timezone
        local_tz = pytz.timezone(settings.TIME_ZONE)
        
        # Convert booking times to local timezone for comparison
        local_start_time = start_time.astimezone(local_tz)
        local_end_time = end_time.astimezone(local_tz)
        
        # Check each day the booking spans
        current_datetime = local_start_time
        while current_datetime.date() <= local_end_time.date():
            day_name = day_names[current_datetime.weekday()]
            
            if day_name not in availability_schedule:
                raise serializers.ValidationError(
                    f"Parking space schedule not configured for {day_name.title()}."
                )
            
            day_schedule = availability_schedule[day_name]
            
            if not day_schedule.get('available', False):
                raise serializers.ValidationError(
                    f"Parking space is not available on {day_name.title()}."
                )
            
            # Parse schedule times
            try:
                schedule_start = datetime.strptime(day_schedule['start'], '%H:%M').time()
                schedule_end = datetime.strptime(day_schedule['end'], '%H:%M').time()
            except (KeyError, ValueError):
                # Skip validation if schedule format is invalid
                current_datetime = current_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
                current_datetime += timezone.timedelta(days=1)
                continue
            
            # Check if booking times fall within available hours for this day
            if current_datetime.date() == local_start_time.date():
                # First day - check start time
                if local_start_time.time() < schedule_start:
                    raise serializers.ValidationError(
                        f"Parking space opens at {day_schedule['start']} on {day_name.title()}."
                    )
            
            if current_datetime.date() == local_end_time.date():
                # Last day - check end time
                if local_end_time.time() > schedule_end:
                    raise serializers.ValidationError(
                        f"Parking space closes at {day_schedule['end']} on {day_name.title()}."
                    )
            
            # Move to next day
            current_datetime = current_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
            current_datetime += timezone.timedelta(days=1)
    
    def _requires_host_approval(self, start_time, end_time, parking_space):
        """
        Determine if booking requires host approval based on availability schedule
        Returns True if booking is outside the allowed time/date parameters
        """
        if not hasattr(parking_space, 'availability_schedule') or not parking_space.availability_schedule:
            # If no schedule is set, require approval for all bookings
            return True
        
        try:
            import pytz
            from django.conf import settings
            from datetime import datetime
            
            availability_schedule = parking_space.availability_schedule
            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            
            # Get the local timezone
            local_tz = pytz.timezone(settings.TIME_ZONE)
            
            # Convert booking times to local timezone for comparison
            local_start_time = start_time.astimezone(local_tz)
            local_end_time = end_time.astimezone(local_tz)
            
            # Check each day the booking spans
            current_datetime = local_start_time
            while current_datetime.date() <= local_end_time.date():
                day_name = day_names[current_datetime.weekday()]
                
                # If day is not in schedule, requires approval
                if day_name not in availability_schedule:
                    return True
                
                day_schedule = availability_schedule[day_name]
                
                # If day is not available, requires approval
                if not day_schedule.get('available', False):
                    return True
                
                # Parse schedule times
                try:
                    schedule_start = datetime.strptime(day_schedule['start'], '%H:%M').time()
                    schedule_end = datetime.strptime(day_schedule['end'], '%H:%M').time()
                except (KeyError, ValueError):
                    # If schedule format is invalid, require approval
                    return True
                
                # Check if booking times fall outside available hours
                if current_datetime.date() == local_start_time.date():
                    # First day - check start time
                    if local_start_time.time() < schedule_start:
                        return True
                
                if current_datetime.date() == local_end_time.date():
                    # Last day - check end time
                    if local_end_time.time() > schedule_end:
                        return True
                
                # Move to next day
                current_datetime = current_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
                current_datetime += timezone.timedelta(days=1)
            
            # If we get here, booking is within allowed parameters
            return False
            
        except Exception:
            # If any error occurs in checking, require approval for safety
            return True

    @transaction.atomic
    def create(self, validated_data):
        """Create booking with atomic transaction and determine approval status"""
        parking_space = validated_data['parking_space']
        start_time = validated_data['start_time']
        end_time = validated_data['end_time']
        
        # Final conflict check within transaction with row-level locking
        with transaction.atomic():
            # Lock the parking space for update to prevent concurrent bookings
            locked_parking_space = parking_space.__class__.objects.select_for_update().get(
                id=parking_space.id
            )
            
            # Re-check for conflicts within the locked transaction
            conflicting_bookings = Booking.objects.filter(
                parking_space=locked_parking_space,
                status__in=[BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            
            if conflicting_bookings.exists():
                raise serializers.ValidationError(
                    "This time slot was just booked by another user. Please select a different time."
                )
            
            # Set the hourly rate from the parking space
            validated_data['hourly_rate'] = locked_parking_space.hourly_rate
            
            # Determine initial status based on approval requirements
            requires_approval = self._requires_host_approval(start_time, end_time, locked_parking_space)
            
            if requires_approval:
                # Booking is outside allowed parameters, needs host approval
                validated_data['status'] = BookingStatus.PENDING
            else:
                # Booking is within allowed parameters, auto-confirm
                validated_data['status'] = BookingStatus.CONFIRMED
                validated_data['confirmed_at'] = timezone.now()
            
            # Create the booking
            booking = super().create(validated_data)
            
            return booking




class BookingReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    booking_id = serializers.CharField(source='booking.booking_id', read_only=True)
    
    class Meta:
        model = BookingReview
        fields = [
            'id', 'booking', 'booking_id', 'reviewer', 'reviewer_name',
            'rating', 'comment', 'cleanliness_rating', 'security_rating',
            'location_rating', 'value_rating', 'is_anonymous', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate(self, data):
        booking = data['booking']
        reviewer = data['reviewer']
        
        # Only allow reviews after booking is completed
        if booking.status != BookingStatus.COMPLETED:
            raise serializers.ValidationError("Can only review completed bookings.")
        
        # Only allow the renter to review
        if booking.user != reviewer:
            raise serializers.ValidationError("Only the renter can review this booking.")
        
        return data


class BookingDetailSerializer(BookingSerializer):
    """Extended serializer with additional details for single booking view"""
    review = BookingReviewSerializer(read_only=True)
    
    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields + ['review']