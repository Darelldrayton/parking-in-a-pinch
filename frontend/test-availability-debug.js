// Debug script to test the availability checking logic
const testAvailabilityDebug = async () => {
  try {
    console.log('🔍 Testing availability checking logic...');
    
    // First get the available listings
    console.log('\n📋 Getting approved listings:');
    const listingsResponse = await fetch('http://localhost:8000/api/v1/listings/', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const listingsData = await listingsResponse.json();
    const listings = listingsData.results || [];
    
    if (listings.length === 0) {
      console.log('❌ No approved listings found!');
      return;
    }
    
    console.log(`✅ Found ${listings.length} approved listings`);
    
    // Test availability check for the first few listings
    const testListings = listings.slice(0, 3); // Test first 3 listings
    
    // Create test time range (5 minutes from now, for 2 hours - same as frontend)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
    
    const startDate = fiveMinutesFromNow.toISOString().split('T')[0];
    const endDate = twoHoursFromNow.toISOString().split('T')[0];
    const startTime = fiveMinutesFromNow.toTimeString().slice(0, 5);
    const endTime = twoHoursFromNow.toTimeString().slice(0, 5);
    
    console.log(`\n⏰ Testing availability for time range:`);
    console.log(`   Start: ${fiveMinutesFromNow.toISOString()} (${startDate} ${startTime})`);
    console.log(`   End: ${twoHoursFromNow.toISOString()} (${endDate} ${endTime})`);
    
    for (const listing of testListings) {
      console.log(`\n🅿️ Testing listing "${listing.title}" (ID: ${listing.id})`);
      console.log(`   Address: ${listing.address}`);
      console.log(`   Rate: $${listing.hourly_rate}/hr`);
      
      // Create availability check request (matches the frontend format)
      const requestData = {
        parking_space_id: listing.id,
        start_time: fiveMinutesFromNow.toISOString(),
        end_time: twoHoursFromNow.toISOString()
      };
      
      console.log('   Request data:', requestData);
      
      try {
        const availabilityResponse = await fetch('http://localhost:8000/api/v1/bookings/bookings/check_availability/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });
        
        console.log(`   Response status: ${availabilityResponse.status}`);
        
        if (!availabilityResponse.ok) {
          const errorText = await availabilityResponse.text();
          console.log(`   ❌ ERROR: ${errorText}`);
          continue;
        }
        
        const availabilityData = await availabilityResponse.json();
        console.log('   Response:', availabilityData);
        
        if (availabilityData.available === true) {
          console.log('   ✅ AVAILABLE - This should show as "Available Now"');
        } else if (availabilityData.available === false) {
          console.log(`   ❌ NOT AVAILABLE - Reason: ${availabilityData.reason || 'Unknown'}`);
          
          if (availabilityData.conflicts) {
            console.log('   Conflicts:');
            availabilityData.conflicts.forEach((conflict, i) => {
              console.log(`     ${i + 1}. ${conflict.start_time} to ${conflict.end_time} (${conflict.status})`);
            });
          }
          
          // This explains why it shows as "Currently Booked"
          console.log('   💡 This is why the frontend shows "Currently Booked"');
        }
        
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    }
    
    console.log('\n🔧 DEBUGGING SUGGESTIONS:');
    console.log('1. Check if there are existing bookings blocking these time slots');
    console.log('2. Check if the availability_schedule is configured correctly');
    console.log('3. Check if the time validation logic is too strict');
    console.log('4. Verify timezone handling between frontend and backend');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testAvailabilityDebug();