# 📧 Automated Email System Setup Guide

## Overview

Your Parking in a Pinch application now has a comprehensive automated email system that sends professional emails for key user events. This guide will help you set it up for production.

## ✨ Features Included

### Automated Email Triggers
- **Welcome Email**: Sent to new users upon registration
- **Listing Approved**: Notifies hosts when their listing is approved
- **New Booking**: Alerts hosts about new bookings
- **Booking Confirmed**: Confirms bookings for guests
- **New Message**: Notifies users about new messages
- **Payment Received**: Notifies hosts about payments

### Email Templates
All emails use professional HTML templates with:
- Responsive design that works on mobile and desktop
- Consistent branding with your Parking in a Pinch identity
- Call-to-action buttons directing users back to your app
- Professional styling with gradients and proper spacing

## 🚀 Quick Setup (Production)

### Step 1: Choose an Email Service

We recommend using one of these services:

#### Option A: SendGrid (Recommended)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your_sendgrid_api_key
DEFAULT_FROM_EMAIL=Parking in a Pinch <noreply@parkinginapinch.com>
```

#### Option B: Gmail SMTP (Small Scale)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=Parking in a Pinch <your-email@gmail.com>
```

#### Option C: AWS SES (Scalable)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_aws_access_key
EMAIL_HOST_PASSWORD=your_aws_secret_key
DEFAULT_FROM_EMAIL=Parking in a Pinch <noreply@parkinginapinch.com>
```

### Step 2: Update Environment Variables

Add these variables to your DigitalOcean environment:

1. Go to your DigitalOcean App Platform dashboard
2. Navigate to your app → Settings → Environment Variables
3. Add the email configuration variables from Step 1
4. Deploy the changes

### Step 3: Test the Email System

After deployment, test the system:

```bash
# SSH into your DigitalOcean server
cd /opt/backend
source venv/bin/activate

# Check email configuration
python manage.py setup_email_service --check-config

# Send a test email
python manage.py setup_email_service --test-email your-email@domain.com

# Test welcome email template
python manage.py setup_email_service --send-welcome your-email@domain.com
```

## 🔧 Development Setup

For local development, emails will be printed to the console by default. To test with real emails locally:

1. Create a `.env` file in your backend directory:
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-test-email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=Parking in a Pinch <your-test-email@gmail.com>
```

2. Test locally:
```bash
cd backend
source venv/bin/activate
python manage.py setup_email_service --test-email your-email@domain.com
```

## 📋 Email Service Providers Setup

### SendGrid Setup (Recommended)

1. **Sign up**: Go to [sendgrid.com](https://sendgrid.com) and create an account
2. **Verify domain**: Add and verify your domain (parkinginapinch.com)
3. **Create API Key**: 
   - Go to Settings → API Keys
   - Create a new API Key with "Full Access"
   - Copy the key and use it as `EMAIL_HOST_PASSWORD`
4. **Set sender authentication**: Verify your sender email address

### Gmail Setup (For Testing)

1. **Enable 2FA**: Enable two-factor authentication on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate an app password for "Mail"
   - Use this password (not your regular password)

### AWS SES Setup (For Scale)

1. **Create AWS account**: Sign up for AWS if you haven't
2. **Request sending limit increase**: By default, SES is in sandbox mode
3. **Verify domain**: Add and verify your domain in SES
4. **Create IAM user**: Create an IAM user with SES sending permissions
5. **Get SMTP credentials**: Generate SMTP credentials in the SES console

## 🎨 Customizing Email Templates

Email templates are located in `backend/templates/emails/`. You can customize:

### Base Template (`base_email.html`)
- Header colors and branding
- Footer content and social links
- Overall styling

### Individual Templates
- `listing_approved.html` - Listing approval notifications
- `new_booking.html` - New booking alerts for hosts
- `booking_confirmed.html` - Booking confirmations for guests
- `new_message.html` - Message notifications
- `payment_received.html` - Payment notifications

### Adding New Email Types

1. Create a new HTML template in `templates/emails/`
2. Add a method to `ParkingEmailService` in `email_service.py`
3. Add signal handlers in `email_signals.py` if needed

## 🔍 Monitoring and Troubleshooting

### Check Email Status
```bash
# View email configuration
python manage.py setup_email_service --check-config

# Check Django logs for email errors
tail -f /var/log/your-app/django.log | grep -i email
```

### Common Issues

**Emails not sending:**
- Check environment variables are set correctly
- Verify email service credentials
- Check spam folders
- Review Django logs for errors

**Emails going to spam:**
- Set up SPF, DKIM, and DMARC records for your domain
- Use a verified sending domain
- Avoid spam trigger words in subject lines

**Rate limiting:**
- Most services have sending limits
- SendGrid: 100 emails/day (free), 40,000+ (paid)
- Gmail: 500 emails/day
- AWS SES: 200 emails/day (free tier)

## 📊 Email Analytics

To track email performance:

1. **SendGrid Analytics**: Built-in dashboard shows opens, clicks, bounces
2. **Custom tracking**: Add tracking pixels to templates
3. **Database logging**: Email send status is logged in the `Notification` model

## 🔐 Security Best Practices

1. **Use app passwords**: Never use regular passwords for SMTP
2. **Environment variables**: Store credentials in environment variables, not code
3. **HTTPS only**: Ensure all email links point to HTTPS URLs
4. **Unsubscribe links**: Include unsubscribe options in marketing emails
5. **Rate limiting**: Implement rate limiting to prevent abuse

## 🚀 Going Live Checklist

- [ ] Email service provider account created and configured
- [ ] Domain verification completed
- [ ] Environment variables set in production
- [ ] Test emails sent successfully
- [ ] Email templates reviewed and customized
- [ ] Spam testing completed
- [ ] Monitoring set up
- [ ] Backup email service configured (optional)

## 📞 Support

If you need help setting up the email system:

1. Check the Django logs for specific error messages
2. Test with the management command: `python manage.py setup_email_service --test-email your-email@domain.com`
3. Verify your email service provider settings
4. Ensure all environment variables are set correctly

Your automated email system is now ready to keep your users engaged and informed! 🎉