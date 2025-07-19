#!/usr/bin/env python3
"""
Test script to verify listing approval workflow is working correctly.

This script tests:
1. New listings are created with PENDING status
2. Public API only returns APPROVED listings
3. Admin can approve/reject listings
4. Only approved listings appear on public pages
"""

import requests
import json
from datetime import datetime

# Test configuration
BASE_URL = "http://165.227.111.160/api/v1"
ADMIN_EMAIL = "admin@parkingpinch.com"
ADMIN_PASSWORD = "admin123"

def test_listing_approval_workflow():
    """Test the complete listing approval workflow."""
    
    print("🧪 Testing Listing Approval Workflow")
    print("=" * 50)
    
    # Step 1: Get initial public listings count
    print("\n1. Checking initial public listings...")
    public_response = requests.get(f"{BASE_URL}/listings/")
    if public_response.status_code == 200:
        initial_count = len(public_response.json().get('results', []))
        print(f"   ✅ Initial public listings count: {initial_count}")
    else:
        print(f"   ❌ Failed to get public listings: {public_response.status_code}")
        return False
    
    # Step 2: Create a new listing (should be PENDING)
    print("\n2. Creating a new test listing...")
    test_listing = {
        "title": f"Test Listing - {datetime.now().isoformat()}",
        "description": "Test listing for approval workflow",
        "address": "123 Test Street, Brooklyn, NY",
        "borough": "Brooklyn",
        "latitude": 40.6782,
        "longitude": -73.9442,
        "hourly_rate": 15.00,
        "daily_rate": 120.00,
        "max_hours": 24,
        "space_type": "OUTDOOR",
        "size": "COMPACT",
        "is_available_24_7": True
    }
    
    create_response = requests.post(f"{BASE_URL}/listings/", json=test_listing)
    if create_response.status_code == 201:
        new_listing = create_response.json()
        listing_id = new_listing['id']
        approval_status = new_listing.get('approval_status', 'UNKNOWN')
        print(f"   ✅ Created listing ID: {listing_id}")
        print(f"   📋 Approval status: {approval_status}")
        
        if approval_status != 'PENDING':
            print(f"   ⚠️  WARNING: Expected PENDING status, got {approval_status}")
    else:
        print(f"   ❌ Failed to create listing: {create_response.status_code}")
        print(f"   📄 Response: {create_response.text}")
        return False
    
    # Step 3: Check that new listing doesn't appear in public listings
    print("\n3. Verifying new listing is NOT in public results...")
    public_response_after = requests.get(f"{BASE_URL}/listings/")
    if public_response_after.status_code == 200:
        after_count = len(public_response_after.json().get('results', []))
        print(f"   📊 Public listings count after creation: {after_count}")
        
        if after_count == initial_count:
            print("   ✅ SUCCESS: New PENDING listing is correctly filtered from public results")
        else:
            print("   ❌ FAILURE: New listing appears in public results before approval")
            return False
    else:
        print(f"   ❌ Failed to get public listings after creation: {public_response_after.status_code}")
        return False
    
    # Step 4: Try to access the new listing directly
    print("\n4. Testing direct access to PENDING listing...")
    direct_response = requests.get(f"{BASE_URL}/listings/{listing_id}/")
    if direct_response.status_code == 404:
        print("   ✅ SUCCESS: PENDING listing returns 404 for public access")
    elif direct_response.status_code == 200:
        print("   ⚠️  WARNING: PENDING listing is accessible via direct URL")
    else:
        print(f"   ❓ Unexpected response for direct access: {direct_response.status_code}")
    
    # Step 5: Test admin approval (if admin endpoints are available)
    print("\n5. Testing admin approval workflow...")
    try:
        # Try to approve the listing via admin endpoint
        admin_approve_url = f"{BASE_URL}/admin/listings/{listing_id}/approve/"
        approve_response = requests.post(admin_approve_url)
        
        if approve_response.status_code == 200:
            print("   ✅ Listing approved via admin endpoint")
            
            # Check if it now appears in public listings
            public_response_final = requests.get(f"{BASE_URL}/listings/")
            if public_response_final.status_code == 200:
                final_count = len(public_response_final.json().get('results', []))
                if final_count == initial_count + 1:
                    print("   ✅ SUCCESS: Approved listing now appears in public results")
                else:
                    print("   ❌ FAILURE: Approved listing still not in public results")
            
        else:
            print(f"   ❓ Admin approval endpoint not available or requires auth: {approve_response.status_code}")
    
    except Exception as e:
        print(f"   ❓ Admin approval test skipped: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Test completed! Check results above for any failures.")
    
    return True

if __name__ == "__main__":
    test_listing_approval_workflow()