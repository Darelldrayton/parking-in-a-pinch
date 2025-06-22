# Payments App

The payments app handles all payment processing functionality for the Parking in a Pinch marketplace using Stripe integration.

## Features

### Core Payment Processing
- **Payment Intents**: Create and manage Stripe payment intents for bookings
- **Payment Methods**: Store and manage user payment methods (cards, bank accounts)
- **Payments**: Track completed payment transactions
- **Refunds**: Process full and partial refunds with various reasons
- **Payouts**: Manage host earnings and payouts
- **Webhook Events**: Handle Stripe webhook events for real-time updates

### Security Features
- Stripe-compliant payment processing
- PCI DSS compliance through Stripe
- Webhook signature verification
- Payment method tokenization
- Secure customer data handling

### Business Logic
- Platform fee calculation (configurable percentage)
- Host payout calculations
- Refund policies and processing
- Payment hold periods
- Automatic payout scheduling

## Models

### PaymentMethod
Stores tokenized payment methods for users.

**Key Fields:**
- `stripe_payment_method_id`: Stripe payment method token
- `payment_type`: Card, bank account, or digital wallet
- `card_brand`, `card_last4`: Display information for cards
- `is_default`: Default payment method flag

### PaymentIntent
Represents a Stripe payment intent for a booking.

**Key Fields:**
- `stripe_payment_intent_id`: Stripe payment intent ID
- `client_secret`: For frontend confirmation
- `amount`: Total payment amount
- `platform_fee`: Platform fee amount
- `status`: Payment intent status

### Payment
Completed payment transaction record.

**Key Fields:**
- `payment_id`: Internal payment identifier
- `stripe_charge_id`: Stripe charge ID
- `amount`: Payment amount
- `platform_fee`: Platform fee taken
- `host_payout_amount`: Amount paid to host
- `status`: Payment status

### Refund
Refund transaction record.

**Key Fields:**
- `refund_id`: Internal refund identifier
- `stripe_refund_id`: Stripe refund ID
- `amount`: Refund amount
- `reason`: Refund reason (cancellation, no-show, etc.)
- `status`: Refund status

### Payout
Host earnings payout record.

**Key Fields:**
- `payout_id`: Internal payout identifier
- `stripe_payout_id`: Stripe payout ID
- `amount`: Total payout amount
- `payments`: Many-to-many with included payments
- `period_start`, `period_end`: Payout period

### WebhookEvent
Stripe webhook event tracking.

**Key Fields:**
- `stripe_event_id`: Stripe event ID
- `event_type`: Type of event
- `status`: Processing status
- `data`: Complete event data

## API Endpoints

### Payment Methods
- `GET /api/v1/payments/payment-methods/` - List user's payment methods
- `POST /api/v1/payments/payment-methods/create_from_stripe/` - Add payment method from Stripe
- `POST /api/v1/payments/payment-methods/{id}/set_default/` - Set as default
- `DELETE /api/v1/payments/payment-methods/{id}/` - Remove payment method

### Payment Intents
- `GET /api/v1/payments/payment-intents/` - List payment intents
- `POST /api/v1/payments/payment-intents/create_intent/` - Create payment intent
- `POST /api/v1/payments/payment-intents/{id}/confirm/` - Confirm payment
- `POST /api/v1/payments/payment-intents/{id}/cancel/` - Cancel payment

### Payments
- `GET /api/v1/payments/payments/` - List payments
- `GET /api/v1/payments/payments/{id}/` - Get payment details
- `GET /api/v1/payments/payments/stats/` - Get payment statistics

### Refunds
- `GET /api/v1/payments/refunds/` - List refunds
- `POST /api/v1/payments/refunds/` - Request refund
- `GET /api/v1/payments/refunds/{id}/` - Get refund details

### Payouts
- `GET /api/v1/payments/payouts/` - List payouts (hosts only)
- `GET /api/v1/payments/payouts/{id}/` - Get payout details
- `GET /api/v1/payments/payouts/earnings/` - Get earnings summary

### Configuration
- `GET /api/v1/payments/config/` - Get Stripe configuration
- `POST /api/v1/payments/webhooks/stripe/` - Stripe webhook endpoint

## Stripe Integration

### Setup Required
1. **Stripe Account**: Create Stripe account and get API keys
2. **Environment Variables**:
   ```
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Webhook Events Handled
- `payment_intent.succeeded` - Payment confirmed
- `payment_intent.payment_failed` - Payment failed
- `charge.succeeded` - Charge completed
- `charge.failed` - Charge failed
- `refund.created` - Refund processed
- `payout.paid` - Payout completed
- `payout.failed` - Payout failed

### Frontend Integration
The app provides configuration for frontend Stripe integration:

```javascript
// Get Stripe config
const config = await fetch('/api/v1/payments/config/').then(r => r.json());

// Initialize Stripe
const stripe = Stripe(config.stripe_public_key);

// Create payment intent
const intent = await fetch('/api/v1/payments/payment-intents/create_intent/', {
  method: 'POST',
  body: JSON.stringify({ booking_id: 'BK12345678' })
}).then(r => r.json());

// Confirm payment
await stripe.confirmPayment({
  elements,
  clientSecret: intent.client_secret,
  confirmParams: {
    return_url: 'https://yoursite.com/payment/complete'
  }
});
```

## Business Logic

### Platform Fees
- Default: 5% of booking amount
- Calculated automatically on payment creation
- Deducted from host payout

### Payout Schedule
- **Frequency**: Weekly (configurable)
- **Day**: Monday (configurable)
- **Hold Period**: 2 days after payment
- **Minimum**: $10.00 per payout

### Refund Policies
- **Full Refund**: Available for various reasons
- **Partial Refund**: Based on timing and policies
- **Platform Fee**: Usually non-refundable
- **Processing**: Automated through Stripe

## Management Commands

### Process Payouts
```bash
python manage.py process_payouts
python manage.py process_payouts --dry-run
python manage.py process_payouts --min-amount=25.00
```

## Filters and Search

All ViewSets include comprehensive filtering:

### Payment Filters
- Status, amount range, date range
- Booking ID, host email
- Payment method type, card brand
- Has refunds, included in payouts

### Advanced Queries
- Payments eligible for payout
- Refund statistics
- Host earnings summaries
- Platform fee totals

## Security Considerations

### Data Protection
- No sensitive card data stored locally
- All payments use Stripe tokens
- Webhook signature verification
- User data isolation

### Compliance
- PCI DSS compliant through Stripe
- GDPR considerations for EU users
- Data retention policies
- Audit logging

## Error Handling

### Stripe Errors
- Network failures with retry logic
- Invalid payment methods
- Insufficient funds
- Authentication errors

### Business Logic Errors
- Invalid booking states
- Duplicate payments
- Refund amount validation
- Payout eligibility checks

## Testing

### Unit Tests
- Model validation
- Serializer logic
- Utility functions
- Business calculations

### Integration Tests
- Stripe API integration
- Webhook processing
- Payment flows
- Payout processing

### Mock Stripe
For testing without real Stripe calls:

```python
# Use Stripe test mode
stripe.api_key = 'sk_test_...'

# Mock webhook events
from unittest.mock import patch
with patch('stripe.Webhook.construct_event'):
    # Test webhook processing
```

## Monitoring and Logging

### Key Metrics
- Payment success rates
- Refund rates
- Payout processing times
- Platform fee collection

### Logging
- All Stripe API calls
- Payment state changes
- Error conditions
- Webhook processing

### Alerts
- Failed payments
- Webhook processing failures
- Payout errors
- High refund rates

## Performance Considerations

### Database Optimization
- Proper indexing on foreign keys
- Query optimization with select_related
- Pagination for large datasets
- Archival of old records

### Stripe API
- Rate limiting compliance
- Webhook idempotency
- Efficient API usage
- Error retry logic

## Future Enhancements

### Features
- Multiple payment methods per transaction
- Subscription billing for monthly parking
- Split payments for shared bookings
- International currency support

### Integrations
- Additional payment providers
- Accounting system integration
- Tax calculation services
- Fraud detection services