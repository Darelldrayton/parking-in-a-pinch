# 💳 Stripe Payment & Payout Setup Guide

## Overview
Your Parking in a Pinch application has a comprehensive payment system built, but needs Stripe API keys configured to process real payments and payouts.

## 🚀 Quick Setup (Test Mode First)

### Step 1: Get Stripe Test Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### Step 2: Update Your Environment Variables

Replace these lines in your `.env` file:

```env
# Replace these placeholder values:
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_TEST_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_MODE=test
```

### Step 3: Set Up Webhooks

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://your-domain.com/api/v1/payments/webhook/`
4. **Select events to listen to**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. Copy the **webhook secret** (starts with `whsec_`) and add it to your `.env` file

### Step 4: Test Payments

Use these test card numbers:
- **Success**: `4242424242424242`
- **Declined**: `4000000000000002`
- **Requires authentication**: `4000002500003155`

## 🏦 Host Payouts Setup (Stripe Connect)

### Step 1: Enable Stripe Connect
1. Go to https://dashboard.stripe.com/settings/applications
2. Enable Connect platform
3. Copy your **Connect Client ID** (starts with `ca_`)
4. Add to `.env`: `STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CLIENT_ID_HERE`

### Step 2: Host Onboarding Flow
The system will automatically:
1. Create Stripe Connect accounts for hosts
2. Handle KYC verification
3. Process weekly payouts (Fridays)
4. Apply 10% platform fee

## 🔧 Current System Features

### ✅ **Already Built For You:**

**Payment Processing:**
- Credit/debit card payments
- Apple Pay & Google Pay
- Payment intents with Stripe
- Automatic booking confirmation
- Refund processing

**Host Payouts:**
- Weekly automatic payouts (Fridays)
- Instant payout option ($0.25 fee)
- Multiple payout methods:
  - Bank transfer (ACH)
  - Wire transfer  
  - PayPal, Zelle, Venmo, Cash App
- 10% platform fee (90% to host)

**Admin Tools:**
- Payment tracking dashboard
- Refund management
- Payout oversight
- Dispute handling

## 🎯 Testing Your Setup

### Test a Complete Payment Flow:

1. **Book a parking space** as a guest
2. **Enter test card**: `4242424242424242`
3. **Complete payment**
4. **Check admin dashboard** for payment record
5. **Verify host payout** is scheduled

### Test Webhooks:
```bash
# Install Stripe CLI for local testing
npm install -g stripe-cli

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:8000/api/v1/payments/webhook/
```

## 🚨 Going Live (Production)

### Step 1: Business Verification
- Complete Stripe account verification
- Add business bank account
- Verify your domain ownership

### Step 2: Switch to Live Keys
1. Go to https://dashboard.stripe.com/live/apikeys
2. Get your live keys (start with `pk_live_` and `sk_live_`)
3. Update `.env`:
```env
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_MODE=live
```

### Step 3: Production Webhooks
1. Create webhook endpoint: `https://parkinginapinch.com/api/v1/payments/webhook/`
2. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

### Step 4: Apple Pay/Google Pay (Optional)
```env
# Add these for mobile payments
VITE_APPLE_PAY_MERCHANT_ID=merchant.parkinginapinch.com
VITE_GOOGLE_PAY_MERCHANT_ID=your_google_pay_merchant_id
```

## 💰 Revenue Model

### Platform Economics:
- **Guest pays**: $20/hour parking
- **Platform fee**: 10% ($2)
- **Host receives**: 90% ($18)
- **Instant payout fee**: $0.25 (optional)

### Payout Schedule:
- **Weekly payouts**: Every Friday
- **Minimum payout**: $1
- **Processing time**: 2-7 business days

## 🔍 Monitoring & Analytics

Your system includes:
- Real-time payment tracking
- Host earnings dashboards
- Revenue analytics
- Failed payment alerts
- Payout history

## 🆘 Troubleshooting

### Common Issues:

**"Payments not working"**
- ✅ Check Stripe keys are correct
- ✅ Verify webhook endpoints are active
- ✅ Ensure account is verified

**"Host payouts failing"**
- ✅ Enable Stripe Connect
- ✅ Complete host KYC verification
- ✅ Verify bank account details

**"Test cards not working"**
- ✅ Use Stripe test cards only in test mode
- ✅ Check card number format (no spaces)
- ✅ Use future expiry dates

## 🎉 You're Ready!

Once you've configured your Stripe keys:
1. **Payments will work** - Guests can pay for parking
2. **Hosts get paid** - Automatic weekly payouts
3. **You earn revenue** - 10% of every transaction
4. **Full tracking** - Monitor everything in dashboards

Your payment system is production-ready and handles everything from booking to payout automatically!