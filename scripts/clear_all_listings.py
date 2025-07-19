#!/usr/bin/env python
"""
Script to clear all listings from the database.
This will permanently delete all listing data.
"""

import os
import sys
import django

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from listings.models import Listing, ListingImage, ListingAvailability
from django.db import transaction

def clear_all_listings():
    """Clear all listings and related data from the database."""
    try:
        # Count current listings
        listing_count = Listing.objects.count()
        image_count = ListingImage.objects.count()
        availability_count = ListingAvailability.objects.count()
        
        print(f"Current database status:")
        print(f"- Listings: {listing_count}")
        print(f"- Listing Images: {image_count}")
        print(f"- Listing Availabilities: {availability_count}")
        
        if listing_count == 0:
            print("\nNo listings found in the database.")
            return
        
        # Confirm deletion
        print(f"\n⚠️  WARNING: This will permanently delete ALL {listing_count} listings!")
        confirmation = input("Type 'DELETE ALL LISTINGS' to confirm: ")
        
        if confirmation != "DELETE ALL LISTINGS":
            print("Deletion cancelled.")
            return
        
        # Delete all listings (this will cascade to images and availabilities)
        with transaction.atomic():
            print("\nDeleting all listings...")
            deleted_count = Listing.objects.all().delete()
            print(f"✅ Successfully deleted {deleted_count[0]} objects:")
            for model, count in deleted_count[1].items():
                print(f"   - {model}: {count}")
        
        # Verify deletion
        remaining_listings = Listing.objects.count()
        remaining_images = ListingImage.objects.count()
        remaining_availability = ListingAvailability.objects.count()
        
        print(f"\nDatabase status after deletion:")
        print(f"- Listings: {remaining_listings}")
        print(f"- Listing Images: {remaining_images}")
        print(f"- Listing Availabilities: {remaining_availability}")
        
        print("\n✅ All listings have been successfully cleared!")
        
    except Exception as e:
        print(f"\n❌ Error clearing listings: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    clear_all_listings()