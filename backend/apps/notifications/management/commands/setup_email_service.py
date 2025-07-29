"""
Management command to set up email service configuration
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from apps.notifications.email_service import ParkingEmailService

User = get_user_model()


class Command(BaseCommand):
    help = 'Set up and test email service configuration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-email',
            type=str,
            help='Send a test email to this address',
        )
        parser.add_argument(
            '--check-config',
            action='store_true',
            help='Check email configuration',
        )
        parser.add_argument(
            '--send-welcome',
            type=str,
            help='Send welcome email to user with this email address',
        )

    def handle(self, *args, **options):
        if options['check_config']:
            self.check_email_config()
        
        if options['test_email']:
            self.send_test_email(options['test_email'])
            
        if options['send_welcome']:
            self.send_welcome_test(options['send_welcome'])

    def check_email_config(self):
        """Check current email configuration"""
        self.stdout.write(self.style.SUCCESS('Email Configuration Check:'))
        self.stdout.write(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        
        if hasattr(settings, 'EMAIL_HOST'):
            self.stdout.write(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        if hasattr(settings, 'EMAIL_PORT'):
            self.stdout.write(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        if hasattr(settings, 'EMAIL_USE_TLS'):
            self.stdout.write(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        if hasattr(settings, 'EMAIL_HOST_USER'):
            self.stdout.write(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
            
        self.stdout.write(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        
        # Check if we're in production mode
        if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
            self.stdout.write(
                self.style.WARNING(
                    '\nWARNING: Currently using console email backend (development mode)'
                )
            )
            self.stdout.write('To enable production emails, set these environment variables:')
            self.stdout.write('EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend')
            self.stdout.write('EMAIL_HOST=your-smtp-server.com')
            self.stdout.write('EMAIL_HOST_USER=your-email@domain.com')
            self.stdout.write('EMAIL_HOST_PASSWORD=your-password')
        else:
            self.stdout.write(
                self.style.SUCCESS('\n✅ Production email backend configured')
            )

    def send_test_email(self, email_address):
        """Send a test email"""
        try:
            subject = 'Test Email from Parking in a Pinch'
            message = '''
            This is a test email from your Parking in a Pinch application.
            
            If you received this email, your email configuration is working correctly!
            
            Best regards,
            The Parking in a Pinch Team
            '''
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_address],
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Test email sent successfully to {email_address}')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to send test email: {str(e)}')
            )

    def send_welcome_test(self, email_address):
        """Send a welcome email test"""
        try:
            # Find or create a test user
            user, created = User.objects.get_or_create(
                email=email_address,
                defaults={
                    'username': email_address.split('@')[0],
                    'first_name': 'Test',
                    'last_name': 'User',
                }
            )
            
            # Send welcome email
            success = ParkingEmailService.send_welcome_email(user)
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Welcome email sent successfully to {email_address}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'❌ Failed to send welcome email to {email_address}')
                )
                
            # Clean up test user if created
            if created:
                user.delete()
                self.stdout.write('Test user cleaned up')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error sending welcome email: {str(e)}')
            )