#!/usr/bin/env python3
"""
Test script to reproduce the search error
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.insert(0, '/home/rellizuraddixion/projects/Parking-in-a-Pinch/backend')

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
    
    # Now test the search functionality
    from apps.listings.models import ParkingListing
    from apps.listings.filters import ParkingListingFilter
    from django.http import QueryDict
    
    print("Testing search functionality...")
    
    # Create a sample query like what would come from the API
    query_params = QueryDict('search=Queens')
    
    # Get the base queryset (this should work)
    queryset = ParkingListing.objects.filter(is_active=True)
    print(f"Base queryset count: {queryset.count()}")
    
    # Try to apply the filter (this should fail)
    try:
        filter_instance = ParkingListingFilter(query_params, queryset=queryset)
        filtered_queryset = filter_instance.qs
        print(f"Filtered queryset count: {filtered_queryset.count()}")
        print("Search test passed!")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure Django and dependencies are installed.")