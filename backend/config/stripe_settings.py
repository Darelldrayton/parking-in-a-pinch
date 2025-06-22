"""
Stripe Configuration Settings
"""
import os
from django.conf import settings

# Stripe API Keys
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

# Stripe Connect Settings
STRIPE_CONNECT_CLIENT_ID = os.environ.get('STRIPE_CONNECT_CLIENT_ID')

# Platform Settings
PLATFORM_FEE_PERCENTAGE = float(os.environ.get('PLATFORM_FEE_PERCENTAGE', '10'))  # 10% default host fee
INSTANT_PAYOUT_FEE = float(os.environ.get('INSTANT_PAYOUT_FEE', '0.25'))  # $0.25 default

# Webhook Configuration
STRIPE_WEBHOOK_TOLERANCE = int(os.environ.get('STRIPE_WEBHOOK_TOLERANCE', '300'))  # 5 minutes

# Currency Settings
DEFAULT_CURRENCY = 'usd'
SUPPORTED_CURRENCIES = ['usd', 'cad', 'eur', 'gbp']

# Payout Schedule
DEFAULT_PAYOUT_SCHEDULE = {
    'interval': 'weekly',
    'weekly_anchor': 'friday'  # Payout every Friday
}

# Payment Method Types
ENABLED_PAYMENT_METHODS = [
    'card',
    'apple_pay',
    'google_pay',
    'link',
    'us_bank_account'
]

# Stripe Connect Application Info
STRIPE_CONNECT_APPLICATION_INFO = {
    'name': 'Parking in a Pinch',
    'version': '1.0.0',
    'url': 'https://parkinginapinch.com'
}

# Validation
def validate_stripe_settings():
    """Validate that required Stripe settings are configured"""
    missing_settings = []
    
    if not STRIPE_SECRET_KEY:
        missing_settings.append('STRIPE_SECRET_KEY')
    
    if not STRIPE_PUBLISHABLE_KEY:
        missing_settings.append('STRIPE_PUBLISHABLE_KEY')
    
    if not STRIPE_WEBHOOK_SECRET:
        missing_settings.append('STRIPE_WEBHOOK_SECRET')
    
    if missing_settings:
        raise ValueError(f"Missing required Stripe settings: {', '.join(missing_settings)}")
    
    return True


# Example .env file content:
ENV_EXAMPLE = """
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id_here

# Platform Settings
PLATFORM_FEE_PERCENTAGE=10
INSTANT_PAYOUT_FEE=0.25

# Webhook Settings
STRIPE_WEBHOOK_TOLERANCE=300
"""