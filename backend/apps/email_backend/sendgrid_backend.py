import logging
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, To, Subject, PlainTextContent, HtmlContent

logger = logging.getLogger(__name__)


class SendGridBackend(BaseEmailBackend):
    """
    Custom SendGrid email backend that uses HTTP API instead of SMTP
    to bypass DigitalOcean's SMTP port restrictions
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', None)
        if not self.api_key:
            if not self.fail_silently:
                raise ValueError("SENDGRID_API_KEY setting is required")
            logger.error("SENDGRID_API_KEY setting is missing")
        
        self.client = SendGridAPIClient(api_key=self.api_key) if self.api_key else None
    
    def send_messages(self, email_messages):
        """
        Send multiple email messages using SendGrid API
        """
        if not self.client:
            if not self.fail_silently:
                raise ValueError("SendGrid client not initialized")
            return 0
        
        sent_count = 0
        for message in email_messages:
            if self._send_message(message):
                sent_count += 1
        
        return sent_count
    
    def _send_message(self, message):
        """
        Send a single email message using SendGrid API
        """
        try:
            # Extract email components
            from_email = message.from_email or settings.DEFAULT_FROM_EMAIL
            to_list = message.to
            subject = message.subject
            
            # Handle plain text and HTML content
            plain_content = None
            html_content = None
            
            if hasattr(message, 'body') and message.body:
                plain_content = message.body
            
            if hasattr(message, 'alternatives'):
                for content, mimetype in message.alternatives:
                    if mimetype == 'text/html':
                        html_content = content
                        break
            
            # Create SendGrid mail object
            mail = Mail()
            mail.from_email = From(from_email)
            mail.subject = Subject(subject)
            
            # Add recipients
            for recipient in to_list:
                mail.add_to(To(recipient))
            
            # Add content
            if plain_content:
                mail.add_content(PlainTextContent(plain_content))
            
            if html_content:
                mail.add_content(HtmlContent(html_content))
            elif plain_content:
                # If no HTML content, use plain text as HTML too
                mail.add_content(HtmlContent(plain_content.replace('\n', '<br>')))
            
            # Send the email
            response = self.client.send(mail)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {to_list}")
                return True
            else:
                logger.error(f"SendGrid API error: {response.status_code} - {response.body}")
                if not self.fail_silently:
                    raise Exception(f"SendGrid API error: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email via SendGrid: {str(e)}")
            if not self.fail_silently:
                raise
            return False