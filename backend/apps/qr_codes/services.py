"""
QR Code Services
"""
import qrcode
import io
import base64
import logging
from PIL import Image, ImageDraw
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.core.files.storage import default_storage
from .models import QRCode, QRCodeTemplate, QRCodeBatch, QRCodeType, QRCodeUsage

logger = logging.getLogger(__name__)


class QRCodeGenerator:
    """QR Code generation service"""
    
    @staticmethod
    def create_qr_code(user, qr_type, booking=None, listing=None, 
                      expiry_hours=24, location_restricted=False, 
                      additional_data=None, template_name=None):
        """
        Create a new QR code
        """
        try:
            # Get template if specified
            template = None
            if template_name:
                template = QRCodeTemplate.objects.get(name=template_name, is_active=True)
                expiry_hours = template.default_expiry_hours
                location_restricted = template.location_restricted
            
            # Calculate expiry
            expires_at = timezone.now() + timedelta(hours=expiry_hours)
            
            # Prepare QR code data
            qr_data = {
                'user_id': user.id,
                'type': qr_type,
                'generated_at': timezone.now().isoformat(),
            }
            
            if booking:
                qr_data.update({
                    'booking_id': booking.id,
                    'listing_id': booking.listing.id,
                    'host_id': booking.listing.host.id,
                })
            
            if listing:
                qr_data.update({
                    'listing_id': listing.id,
                    'host_id': listing.host.id,
                })
            
            if additional_data:
                qr_data.update(additional_data)
            
            # Create QR code record
            qr_code = QRCode.objects.create(
                user=user,
                booking=booking,
                listing=listing or (booking.listing if booking else None),
                qr_type=qr_type,
                data=qr_data,
                expires_at=expires_at,
                location_restricted=location_restricted
            )
            
            # Set location restrictions
            if location_restricted and booking:
                qr_code.allowed_latitude = booking.listing.latitude
                qr_code.allowed_longitude = booking.listing.longitude
                qr_code.allowed_radius = 50  # 50 meters
                qr_code.save()
            
            # Generate QR code image
            qr_image_data = QRCodeGenerator.generate_qr_image(
                qr_code.verification_url,
                template=template
            )
            
            return {
                'qr_code': qr_code,
                'qr_image_data': qr_image_data,
                'verification_url': qr_code.verification_url,
                'expires_at': qr_code.expires_at
            }
            
        except Exception as e:
            logger.error(f"Error creating QR code: {str(e)}")
            raise e
    
    @staticmethod
    def generate_qr_image(data, template=None, size=(300, 300)):
        """
        Generate QR code image
        """
        try:
            # QR code settings
            error_correction = qrcode.constants.ERROR_CORRECT_M
            if template:
                error_correction_map = {
                    'L': qrcode.constants.ERROR_CORRECT_L,
                    'M': qrcode.constants.ERROR_CORRECT_M,
                    'Q': qrcode.constants.ERROR_CORRECT_Q,
                    'H': qrcode.constants.ERROR_CORRECT_H,
                }
                error_correction = error_correction_map.get(
                    template.error_correction_level, 
                    qrcode.constants.ERROR_CORRECT_M
                )
            
            # Create QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=error_correction,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            img = img.resize(size, Image.LANCZOS)
            
            # Add logo if template specifies
            if template and template.include_logo:
                img = QRCodeGenerator._add_logo(img)
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            logger.error(f"Error generating QR image: {str(e)}")
            raise e
    
    @staticmethod
    def _add_logo(qr_img, logo_size_ratio=0.2):
        """
        Add logo to center of QR code
        """
        try:
            # Create a simple logo (in production, use actual logo file)
            logo_size = int(min(qr_img.size) * logo_size_ratio)
            logo = Image.new('RGB', (logo_size, logo_size), 'white')
            
            # Draw a simple parking icon
            draw = ImageDraw.Draw(logo)
            margin = logo_size // 6
            draw.rectangle(
                [margin, margin, logo_size - margin, logo_size - margin],
                outline='black',
                width=2
            )
            draw.text(
                (logo_size // 2 - 5, logo_size // 2 - 5),
                'P',
                fill='black'
            )
            
            # Calculate position
            pos = (
                (qr_img.size[0] - logo_size) // 2,
                (qr_img.size[1] - logo_size) // 2
            )
            
            # Paste logo
            qr_img.paste(logo, pos)
            return qr_img
            
        except Exception as e:
            logger.warning(f"Failed to add logo to QR code: {str(e)}")
            return qr_img


class QRCodeVerifier:
    """QR Code verification service"""
    
    @staticmethod
    def verify_qr_code(token, user_location=None, ip_address=None, user_agent=None):
        """
        Verify and use a QR code
        """
        try:
            # Find QR code
            try:
                qr_code = QRCode.objects.get(token=token)
            except QRCode.DoesNotExist:
                return {
                    'success': False,
                    'error': 'Invalid QR code',
                    'error_code': 'INVALID_TOKEN'
                }
            
            # Check if valid
            if not qr_code.is_valid():
                return {
                    'success': False,
                    'error': 'QR code has expired or is no longer valid',
                    'error_code': 'EXPIRED_OR_INVALID',
                    'qr_code': qr_code
                }
            
            # Use the code
            try:
                qr_code.use_code(
                    user_location=user_location,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except ValueError as e:
                return {
                    'success': False,
                    'error': str(e),
                    'error_code': 'USAGE_VIOLATION',
                    'qr_code': qr_code
                }
            
            # Process based on QR code type
            result = QRCodeVerifier._process_qr_action(qr_code, user_location)
            
            result.update({
                'success': True,
                'qr_code': qr_code,
                'message': 'QR code verified successfully'
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error verifying QR code: {str(e)}")
            return {
                'success': False,
                'error': 'Verification failed due to system error',
                'error_code': 'SYSTEM_ERROR'
            }
    
    @staticmethod
    def _process_qr_action(qr_code, user_location):
        """
        Process QR code action based on type
        """
        result = {'action_taken': None}
        
        try:
            if qr_code.qr_type == QRCodeType.CHECKIN:
                result.update(QRCodeVerifier._process_checkin(qr_code, user_location))
            
            elif qr_code.qr_type == QRCodeType.CHECKOUT:
                result.update(QRCodeVerifier._process_checkout(qr_code, user_location))
            
            elif qr_code.qr_type == QRCodeType.LISTING_INFO:
                result.update(QRCodeVerifier._process_listing_info(qr_code))
            
            elif qr_code.qr_type == QRCodeType.EMERGENCY:
                result.update(QRCodeVerifier._process_emergency(qr_code, user_location))
            
            elif qr_code.qr_type == QRCodeType.PAYMENT:
                result.update(QRCodeVerifier._process_payment(qr_code))
            
        except Exception as e:
            logger.error(f"Error processing QR action: {str(e)}")
            result['action_error'] = str(e)
        
        return result
    
    @staticmethod
    def _process_checkin(qr_code, user_location):
        """Process check-in QR code"""
        if not qr_code.booking:
            return {'action_error': 'No booking associated with QR code'}
        
        if not user_location:
            return {'action_error': 'Location required for check-in'}
        
        try:
            from apps.location.services import LocationService
            
            result = LocationService.process_checkin(
                user=qr_code.user,
                booking=qr_code.booking,
                latitude=user_location['latitude'],
                longitude=user_location['longitude'],
                accuracy=user_location.get('accuracy'),
                verification_method='qr_code',
                additional_data={'qr_token': qr_code.token}
            )
            
            return {
                'action_taken': 'checkin',
                'checkin_result': result,
                'booking_id': qr_code.booking.id
            }
            
        except Exception as e:
            return {'action_error': f'Check-in failed: {str(e)}'}
    
    @staticmethod
    def _process_checkout(qr_code, user_location):
        """Process check-out QR code"""
        if not qr_code.booking:
            return {'action_error': 'No booking associated with QR code'}
        
        if not user_location:
            return {'action_error': 'Location required for check-out'}
        
        try:
            from apps.location.services import LocationService
            
            result = LocationService.process_checkout(
                user=qr_code.user,
                booking=qr_code.booking,
                latitude=user_location['latitude'],
                longitude=user_location['longitude'],
                accuracy=user_location.get('accuracy'),
                verification_method='qr_code',
                additional_data={'qr_token': qr_code.token}
            )
            
            return {
                'action_taken': 'checkout',
                'checkout_result': result,
                'booking_id': qr_code.booking.id
            }
            
        except Exception as e:
            return {'action_error': f'Check-out failed: {str(e)}'}
    
    @staticmethod
    def _process_listing_info(qr_code):
        """Process listing info QR code"""
        if not qr_code.listing:
            return {'action_error': 'No listing associated with QR code'}
        
        return {
            'action_taken': 'listing_info',
            'listing_id': qr_code.listing.id,
            'listing_title': qr_code.listing.title,
            'listing_url': f'/listings/{qr_code.listing.id}/'
        }
    
    @staticmethod
    def _process_emergency(qr_code, user_location):
        """Process emergency QR code"""
        try:
            from apps.location.services import EmergencyLocationService
            
            if user_location:
                result = EmergencyLocationService.trigger_emergency_alert(
                    user=qr_code.user,
                    latitude=user_location['latitude'],
                    longitude=user_location['longitude'],
                    message="Emergency QR code scanned"
                )
                
                return {
                    'action_taken': 'emergency_alert',
                    'emergency_result': result
                }
            else:
                return {'action_error': 'Location required for emergency alert'}
                
        except Exception as e:
            return {'action_error': f'Emergency alert failed: {str(e)}'}
    
    @staticmethod
    def _process_payment(qr_code):
        """Process payment QR code"""
        if not qr_code.booking:
            return {'action_error': 'No booking associated with QR code'}
        
        return {
            'action_taken': 'payment_redirect',
            'booking_id': qr_code.booking.id,
            'payment_url': f'/bookings/{qr_code.booking.id}/payment/'
        }


class QRCodeBatchProcessor:
    """Batch QR code generation"""
    
    @staticmethod
    def create_batch(created_by, template, quantity, name, description="", prefix=""):
        """
        Create a batch of QR codes
        """
        try:
            batch = QRCodeBatch.objects.create(
                name=name,
                description=description,
                created_by=created_by,
                template=template,
                quantity=quantity,
                prefix=prefix
            )
            
            # Start async generation (in production, use Celery)
            QRCodeBatchProcessor._generate_batch(batch)
            
            return batch
            
        except Exception as e:
            logger.error(f"Error creating QR batch: {str(e)}")
            raise e
    
    @staticmethod
    def _generate_batch(batch):
        """
        Generate QR codes for batch
        """
        try:
            batch.status = 'generating'
            batch.started_at = timezone.now()
            batch.save()
            
            for i in range(batch.quantity):
                try:
                    # Generate unique data for each QR code
                    qr_data = {
                        'batch_id': str(batch.id),
                        'sequence': i + 1,
                        'prefix': batch.prefix
                    }
                    
                    if batch.template.data_template:
                        qr_data.update(batch.template.data_template)
                    
                    # Create QR code
                    result = QRCodeGenerator.create_qr_code(
                        user=batch.created_by,
                        qr_type=batch.template.qr_type,
                        expiry_hours=batch.template.default_expiry_hours,
                        location_restricted=batch.template.location_restricted,
                        additional_data=qr_data,
                        template_name=batch.template.name
                    )
                    
                    batch.generated_count += 1
                    
                except Exception as e:
                    logger.error(f"Error generating QR {i+1} in batch {batch.id}: {str(e)}")
                    batch.failed_count += 1
                
                batch.save()
            
            # Complete batch
            batch.status = 'completed'
            batch.completed_at = timezone.now()
            batch.save()
            
            # Generate download URL (in production, create ZIP file)
            batch.download_url = f"/api/v1/qr-codes/batches/{batch.id}/download/"
            batch.save()
            
        except Exception as e:
            logger.error(f"Error generating batch {batch.id}: {str(e)}")
            batch.status = 'failed'
            batch.error_log = str(e)
            batch.save()


class QRCodeAnalytics:
    """QR Code usage analytics"""
    
    @staticmethod
    def get_usage_stats(user, days=30):
        """Get QR code usage statistics"""
        from datetime import timedelta
        from django.db.models import Count, Q
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get user's QR codes
        qr_codes = QRCode.objects.filter(user=user, generated_at__gte=start_date)
        
        stats = {
            'total_generated': qr_codes.count(),
            'total_used': qr_codes.filter(current_uses__gt=0).count(),
            'total_expired': qr_codes.filter(status='expired').count(),
            'by_type': {},
            'usage_by_day': []
        }
        
        # Stats by type
        for qr_type, _ in QRCodeType.choices:
            type_codes = qr_codes.filter(qr_type=qr_type)
            stats['by_type'][qr_type] = {
                'generated': type_codes.count(),
                'used': type_codes.filter(current_uses__gt=0).count()
            }
        
        return stats
    
    @staticmethod
    def get_system_stats():
        """Get system-wide QR code statistics"""
        from django.db.models import Count, Sum
        
        stats = {
            'total_codes': QRCode.objects.count(),
            'active_codes': QRCode.objects.filter(status='active').count(),
            'used_codes': QRCode.objects.filter(status='used').count(),
            'expired_codes': QRCode.objects.filter(status='expired').count(),
            'total_usage': QRCodeUsage.objects.count(),
            'by_type': {}
        }
        
        # Usage by type
        for qr_type, _ in QRCodeType.choices:
            stats['by_type'][qr_type] = QRCode.objects.filter(qr_type=qr_type).count()
        
        return stats