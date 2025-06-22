"""
Basic tests for payments app.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from unittest.mock import patch, MagicMock

User = get_user_model()


class PaymentModelsTest(TestCase):
    """Test payment models."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
    
    def test_payment_method_str(self):
        """Test PaymentMethod string representation."""
        from .models import PaymentMethod
        
        payment_method = PaymentMethod(
            user=self.user,
            payment_type='card',
            card_brand='visa',
            card_last4='4242',
        )
        
        self.assertEqual(str(payment_method), 'Visa •••• 4242')
    
    def test_payment_id_generation(self):
        """Test Payment ID generation."""
        from .models import Payment, PaymentIntent
        from apps.bookings.models import Booking
        from apps.listings.models import ParkingListing
        
        # Create required objects (simplified)
        listing = ParkingListing.objects.create(
            host=self.user,
            title='Test Parking',
            address='123 Test St',
            borough='Manhattan',
            space_type='driveway',
            hourly_rate=Decimal('10.00'),
            daily_rate=Decimal('50.00'),
            weekly_rate=Decimal('300.00'),
        )
        
        booking = Booking.objects.create(
            user=self.user,
            parking_space=listing,
            start_time='2024-01-01 10:00:00+00:00',
            end_time='2024-01-01 12:00:00+00:00',
            hourly_rate=Decimal('10.00'),
            vehicle_license_plate='ABC123',
        )
        
        payment_intent = PaymentIntent.objects.create(
            booking=booking,
            user=self.user,
            stripe_payment_intent_id='pi_test123',
            client_secret='pi_test123_secret',
            amount=Decimal('20.00'),
            platform_fee=Decimal('1.00'),
        )
        
        payment = Payment.objects.create(
            payment_intent=payment_intent,
            user=self.user,
            booking=booking,
            stripe_charge_id='ch_test123',
            amount=Decimal('20.00'),
            payment_method_type='card',
        )
        
        self.assertTrue(payment.payment_id.startswith('PAY'))
        self.assertEqual(len(payment.payment_id), 11)  # PAY + 8 chars
    
    def test_platform_fee_calculation(self):
        """Test platform fee calculation."""
        from .utils import calculate_platform_fee
        
        amount = Decimal('100.00')
        fee = calculate_platform_fee(amount, 5.0)
        self.assertEqual(fee, Decimal('5.00'))
        
        fee = calculate_platform_fee(amount, 3.0)
        self.assertEqual(fee, Decimal('3.00'))


class PaymentSerializersTest(TestCase):
    """Test payment serializers."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
    
    def test_payment_method_serializer(self):
        """Test PaymentMethodSerializer."""
        from .models import PaymentMethod
        from .serializers import PaymentMethodSerializer
        
        payment_method = PaymentMethod.objects.create(
            user=self.user,
            stripe_payment_method_id='pm_test123',
            payment_type='card',
            card_brand='visa',
            card_last4='4242',
            card_exp_month=12,
            card_exp_year=2025,
        )
        
        serializer = PaymentMethodSerializer(payment_method)
        data = serializer.data
        
        self.assertEqual(data['payment_type'], 'card')
        self.assertEqual(data['card_brand'], 'visa')
        self.assertEqual(data['card_last4'], '4242')
        self.assertEqual(data['display_name'], 'Visa •••• 4242')


class PaymentUtilsTest(TestCase):
    """Test payment utility functions."""
    
    def test_validate_payment_amount(self):
        """Test payment amount validation."""
        from .utils import validate_payment_amount
        
        # Valid amounts
        self.assertTrue(validate_payment_amount(Decimal('10.00')))
        self.assertTrue(validate_payment_amount(Decimal('0.01')))
        
        # Invalid amounts
        with self.assertRaises(ValueError):
            validate_payment_amount(Decimal('0.00'))
        
        with self.assertRaises(ValueError):
            validate_payment_amount(Decimal('-10.00'))
        
        with self.assertRaises(ValueError):
            validate_payment_amount(Decimal('10.001'))  # Too many decimal places
    
    def test_format_payment_description(self):
        """Test payment description formatting."""
        from .utils import format_payment_description
        from apps.bookings.models import Booking
        from apps.listings.models import ParkingListing
        from django.utils import timezone
        
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        
        listing = ParkingListing.objects.create(
            host=user,
            title='Downtown Parking',
            address='123 Main St',
            borough='Manhattan',
            space_type='garage',
            hourly_rate=Decimal('15.00'),
            daily_rate=Decimal('75.00'),
            weekly_rate=Decimal('450.00'),
        )
        
        start_time = timezone.make_aware(timezone.datetime(2024, 1, 15, 10, 0))
        end_time = timezone.make_aware(timezone.datetime(2024, 1, 15, 14, 0))
        
        booking = Booking.objects.create(
            user=user,
            parking_space=listing,
            start_time=start_time,
            end_time=end_time,
            hourly_rate=Decimal('15.00'),
            vehicle_license_plate='XYZ789',
        )
        
        description = format_payment_description(booking)
        self.assertIn('Downtown Parking', description)
        self.assertIn('01/15/2024', description)


class StripeIntegrationTest(TestCase):
    """Test Stripe integration (mocked)."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
    
    @patch('stripe.Customer.create')
    def test_create_stripe_customer(self, mock_create):
        """Test Stripe customer creation."""
        from .utils import create_stripe_customer
        
        mock_customer = MagicMock()
        mock_customer.id = 'cus_test123'
        mock_create.return_value = mock_customer
        
        customer_id = create_stripe_customer(self.user)
        
        self.assertEqual(customer_id, 'cus_test123')
        self.user.refresh_from_db()
        self.assertEqual(self.user.stripe_customer_id, 'cus_test123')
        
        mock_create.assert_called_once_with(
            email=self.user.email,
            name=self.user.get_full_name(),
            phone=None,
            metadata={'user_id': self.user.id}
        )


class PaymentFiltersTest(TestCase):
    """Test payment filters."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
    
    def test_payment_method_filter(self):
        """Test PaymentMethodFilter."""
        from .models import PaymentMethod
        from .filters import PaymentMethodFilter
        
        # Create test payment methods
        pm1 = PaymentMethod.objects.create(
            user=self.user,
            stripe_payment_method_id='pm_test1',
            payment_type='card',
            card_brand='visa',
            is_default=True,
        )
        
        pm2 = PaymentMethod.objects.create(
            user=self.user,
            stripe_payment_method_id='pm_test2',
            payment_type='bank_account',
            is_default=False,
        )
        
        # Test filtering
        queryset = PaymentMethod.objects.all()
        
        # Filter by payment type
        filter_obj = PaymentMethodFilter({'payment_type': 'card'}, queryset=queryset)
        self.assertEqual(list(filter_obj.qs), [pm1])
        
        # Filter by is_default
        filter_obj = PaymentMethodFilter({'is_default': True}, queryset=queryset)
        self.assertEqual(list(filter_obj.qs), [pm1])


class PaymentSignalsTest(TestCase):
    """Test payment signals."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
    
    def test_payment_method_default_signal(self):
        """Test that setting a payment method as default unsets others."""
        from .models import PaymentMethod
        
        # Create two payment methods
        pm1 = PaymentMethod.objects.create(
            user=self.user,
            stripe_payment_method_id='pm_test1',
            payment_type='card',
            is_default=True,
        )
        
        pm2 = PaymentMethod.objects.create(
            user=self.user,
            stripe_payment_method_id='pm_test2',
            payment_type='card',
            is_default=True,  # This should unset pm1
        )
        
        pm1.refresh_from_db()
        self.assertFalse(pm1.is_default)
        self.assertTrue(pm2.is_default)