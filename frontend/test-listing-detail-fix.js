// Test script to verify the listing detail page availability fix
const testListingDetailFix = async () => {
  try {
    console.log('🔍 Testing listing detail page availability display...');
    
    // Get a specific listing to test
    console.log('\n📋 Getting a specific listing:');
    const listingsResponse = await fetch('http://localhost:8000/api/v1/listings/', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const listingsData = await listingsResponse.json();
    const listings = listingsData.results || [];
    
    if (listings.length === 0) {
      console.log('❌ No listings found for testing!');
      return;
    }
    
    const testListing = listings[0]; // Get first listing
    console.log(`✅ Testing with listing: "${testListing.title}" (ID: ${testListing.id})`);
    
    // Test the specific listing detail endpoint
    console.log('\n📋 Testing listing detail endpoint:');
    const detailResponse = await fetch(`http://localhost:8000/api/v1/listings/${testListing.id}/`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!detailResponse.ok) {
      console.error('❌ Listing detail API error:', detailResponse.status);
      return;
    }
    
    const detailData = await detailResponse.json();
    console.log('✅ Listing detail response received');
    console.log(`   Title: ${detailData.title}`);
    console.log(`   is_active: ${detailData.is_active}`);
    console.log(`   availability_schedule:`, detailData.availability_schedule ? 'Present' : 'Missing');
    
    // Test availability check for this specific listing
    console.log('\n⏰ Testing availability for this listing:');
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
    
    const requestData = {
      parking_space_id: testListing.id,
      start_time: fiveMinutesFromNow.toISOString(),
      end_time: twoHoursFromNow.toISOString()
    };
    
    const availabilityResponse = await fetch('http://localhost:8000/api/v1/bookings/bookings/check_availability/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    if (!availabilityResponse.ok) {
      console.error('❌ Availability check error:', availabilityResponse.status);
      return;
    }
    
    const availabilityData = await availabilityResponse.json();
    console.log('✅ Availability check response:', availabilityData);
    
    console.log('\n🎯 EXPECTED BEHAVIOR ON LISTING DETAIL PAGE:');
    console.log(`   Before fix: Always showed "Available" (if is_active=true)`);
    console.log(`   After fix: Should show "${availabilityData.available ? 'Available Now' : getDisplayMessage(availabilityData.reason)}"`);
    
    function getDisplayMessage(reason) {
      if (!reason) return 'Not Available';
      if (reason.includes('opens at')) {
        const timeMatch = reason.match(/(\d{1,2}:\d{2})/);
        return timeMatch ? `Opens at ${timeMatch[1]}` : 'Outside Operating Hours';
      }
      if (reason.includes('conflict') || reason.includes('booking')) {
        return 'Currently Booked';
      }
      return 'Not Available Now';
    }
    
    console.log('\n💡 SUMMARY:');
    if (availabilityData.available) {
      console.log('   ✅ This listing is currently available - should show "Available Now"');
    } else {
      console.log(`   ⚠️ This listing is not available - should show "${getDisplayMessage(availabilityData.reason)}"`);
      console.log(`   📝 Reason: ${availabilityData.reason}`);
    }
    
    console.log('\n🔧 TO VERIFY THE FIX:');
    console.log(`   1. Open the listing detail page: http://localhost:3000/listings/${testListing.id}`);
    console.log('   2. Check that the availability chip shows the correct status');
    console.log('   3. Check that the booking button text reflects the availability');
    console.log('   4. Compare with the search page to ensure consistency');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testListingDetailFix();