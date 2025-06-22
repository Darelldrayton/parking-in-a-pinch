// Test script to check if admin can update listings
const testListingUpdate = async () => {
  try {
    console.log('🔐 Testing admin login...');
    
    // First login as admin
    const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.access && !loginData.tokens?.access) {
      console.error('❌ No access token received');
      return;
    }
    
    const token = loginData.access || loginData.tokens?.access;
    console.log('✅ Got admin token');
    
    // Get a listing to test with
    console.log('📋 Getting listings...');
    const listingsResponse = await fetch('http://localhost:8000/api/v1/listings/admin/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const listingsData = await listingsResponse.json();
    const listings = listingsData.results || listingsData || [];
    
    if (listings.length === 0) {
      console.error('❌ No listings found to test with');
      return;
    }
    
    const testListing = listings[0];
    console.log('🎯 Testing with listing:', testListing.id, testListing.title);
    
    // Try to update the listing
    console.log('💾 Attempting to update listing...');
    const updateResponse = await fetch(`http://localhost:8000/api/v1/listings/admin/${testListing.id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: testListing.title + ' (UPDATED)',
        description: testListing.description + ' - Updated by admin test',
        address: testListing.address,
        borough: testListing.borough,
        space_type: testListing.space_type,
        hourly_rate: testListing.hourly_rate
      })
    });
    
    console.log('Update response status:', updateResponse.status);
    console.log('Update response headers:', Object.fromEntries(updateResponse.headers.entries()));
    
    if (updateResponse.ok) {
      const updatedData = await updateResponse.json();
      console.log('✅ Update successful!');
      console.log('Updated listing:', updatedData);
    } else {
      const errorText = await updateResponse.text();
      console.error('❌ Update failed:');
      console.error('Status:', updateResponse.status);
      console.error('Response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testListingUpdate();