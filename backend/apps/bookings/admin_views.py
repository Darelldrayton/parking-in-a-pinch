from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import Booking


@staff_member_required
def booking_search_view(request):
    """
    Admin view for searching bookings by reservation number
    """
    context = {
        'title': 'Booking Search',
        'booking': None,
        'search_performed': False,
        'search_term': ''
    }
    
    if request.method == 'POST':
        search_term = request.POST.get('search_term', '').strip()
        context['search_term'] = search_term
        context['search_performed'] = True
        
        if search_term:
            # Clean the search term - remove common prefixes
            clean_term = search_term.replace('#', '').replace('Reservation', '').replace('reservation', '').strip()
            
            try:
                # Try to find booking by booking_id
                booking = Booking.objects.get(
                    Q(booking_id__iexact=clean_term) | Q(booking_id__icontains=clean_term)
                )
                context['booking'] = booking
                messages.success(request, f'Booking found: {booking.booking_id}')
                
            except Booking.DoesNotExist:
                messages.error(request, f'No booking found with reservation number: {search_term}')
            except Booking.MultipleObjectsReturned:
                # If multiple results, get all matches
                bookings = Booking.objects.filter(
                    Q(booking_id__icontains=clean_term)
                ).order_by('-created_at')
                context['multiple_bookings'] = bookings
                messages.warning(request, f'Multiple bookings found matching: {search_term}')
        else:
            messages.error(request, 'Please enter a reservation number to search.')
    
    return render(request, 'admin/bookings/booking_search.html', context)


@staff_member_required
def quick_booking_lookup(request):
    """
    AJAX endpoint for quick booking lookup
    """
    if request.method == 'GET':
        search_term = request.GET.get('q', '').strip()
        
        if not search_term:
            return JsonResponse({'error': 'No search term provided'}, status=400)
        
        # Clean the search term
        clean_term = search_term.replace('#', '').replace('Reservation', '').replace('reservation', '').strip()
        
        try:
            booking = Booking.objects.get(booking_id__iexact=clean_term)
            
            return JsonResponse({
                'success': True,
                'booking': {
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'user_name': booking.user.get_full_name() if booking.user else 'N/A',
                    'user_email': booking.user.email if booking.user else 'N/A',
                    'parking_space': booking.parking_space.title if booking.parking_space else 'N/A',
                    'status': booking.status,
                    'start_time': booking.start_time.strftime('%Y-%m-%d %H:%M'),
                    'end_time': booking.end_time.strftime('%Y-%m-%d %H:%M'),
                    'total_amount': str(booking.total_amount),
                    'detail_url': f'/booking/{booking.id}',
                    'admin_url': reverse('admin:bookings_booking_change', args=[booking.id])
                }
            })
            
        except Booking.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'No booking found with reservation number: {search_term}'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Error searching for booking: {str(e)}'
            })
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@staff_member_required 
def redirect_to_booking_detail(request, booking_id):
    """
    Redirect to the frontend booking detail page
    """
    booking = get_object_or_404(Booking, booking_id=booking_id)
    return redirect(f'/booking/{booking.id}')


@api_view(['GET'])
def admin_booking_search_api(request):
    """
    API endpoint for admin booking search - used by the React frontend
    """
    # Check if user is authenticated and is staff
    if not request.user.is_authenticated:
        return Response({
            'success': False,
            'error': 'Authentication required'
        }, status=401)
    
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({
            'success': False,
            'error': 'Admin privileges required'
        }, status=403)
    
    search_term = request.GET.get('q', '').strip()
    
    if not search_term:
        return Response({
            'success': False,
            'error': 'No search term provided'
        }, status=400)
    
    # Clean the search term
    clean_term = search_term.replace('#', '').replace('Reservation', '').replace('reservation', '').strip()
    
    try:
        # Search for bookings by booking_id, user name, or user email
        bookings = Booking.objects.filter(
            Q(booking_id__icontains=clean_term) |
            Q(user__first_name__icontains=clean_term) |
            Q(user__last_name__icontains=clean_term) |
            Q(user__email__icontains=clean_term)
        ).select_related('user', 'parking_space').order_by('-created_at')[:10]  # Limit to 10 results
        
        if bookings.exists():
            results = []
            for booking in bookings:
                user_name = f"{booking.user.first_name} {booking.user.last_name}".strip() if booking.user else 'N/A'
                if not user_name or user_name == 'N/A':
                    user_name = booking.user.username if booking.user else 'N/A'
                
                results.append({
                    'booking_id': booking.booking_id,
                    'user_name': user_name,
                    'user_email': booking.user.email if booking.user else 'N/A',
                    'user_phone': booking.user.phone_number if booking.user and booking.user.phone_number else 'N/A',
                    'status': booking.status,
                    'status_display': booking.get_status_display() if hasattr(booking, 'get_status_display') else booking.status,
                    'parking_space': booking.parking_space.title if booking.parking_space else 'N/A',
                    'parking_address': booking.parking_space.address if booking.parking_space else 'N/A',
                    'total_amount': str(booking.total_amount),
                    'payment_status': getattr(booking, 'payment_status', 'N/A'),
                    'vehicle_info': f"{getattr(booking, 'vehicle_make', '')} {getattr(booking, 'vehicle_model', '')}".strip() or 'N/A',
                    'check_in_code': getattr(booking, 'check_in_code', 'N/A'),
                    'detail_url': f'/booking/{booking.id}',
                    'admin_url': f'/admin/bookings/booking/{booking.id}/change/',
                    'start_time': booking.start_time.strftime('%Y-%m-%d %H:%M') if booking.start_time else '',
                    'end_time': booking.end_time.strftime('%Y-%m-%d %H:%M') if booking.end_time else '',
                    'created_at': booking.created_at.strftime('%Y-%m-%d %H:%M') if booking.created_at else '',
                    'duration_hours': round((booking.end_time - booking.start_time).total_seconds() / 3600, 1) if booking.start_time and booking.end_time else 0,
                })
            
            return Response({
                'success': True,
                'results': results,
                'count': len(results)
            })
        else:
            return Response({
                'success': False,
                'results': [],
                'error': f'No bookings found for: {search_term}'
            })
            
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Error searching for bookings: {str(e)}'
        }, status=500)