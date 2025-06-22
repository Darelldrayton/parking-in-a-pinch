// Quick test script to check admin listings API
const testAdminAPI = async () => {
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
    console.log('Login response:', loginData);
    
    if (!loginData.access && !loginData.tokens?.access) {
      console.error('❌ No access token received');
      return;
    }
    
    const token = loginData.access || loginData.tokens?.access;
    console.log('✅ Got admin token');
    
    // Test admin listings endpoint
    console.log('📋 Testing admin listings endpoint...');
    const listingsResponse = await fetch('http://localhost:8000/api/v1/listings/admin/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Listings response status:', listingsResponse.status);
    console.log('Listings response headers:', Object.fromEntries(listingsResponse.headers.entries()));
    
    if (!listingsResponse.ok) {
      const errorText = await listingsResponse.text();
      console.error('❌ Listings API error:', errorText);
      return;
    }
    
    const listingsData = await listingsResponse.json();
    console.log('✅ Listings API response:', listingsData);
    
    const allListings = listingsData.results || listingsData || [];
    console.log('📊 Total listings:', allListings.length);
    
    const pendingListings = allListings.filter(listing => listing.approval_status === 'PENDING');
    console.log('⏳ Pending listings:', pendingListings.length);
    
    pendingListings.forEach((listing, index) => {
      console.log(`${index + 1}. Listing ID: ${listing.id}`);
      console.log(`   Title: ${listing.title}`);
      console.log(`   Status: ${listing.approval_status}`);
      console.log(`   can_be_reviewed: ${listing.can_be_reviewed}`);
      console.log(`   Host: ${listing.host_name}`);
      console.log('   Full listing:', listing);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testAdminAPI();