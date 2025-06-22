// Debug script to check what listings are available and their approval status
const testListingsDebug = async () => {
  try {
    console.log('🔍 Testing listings API to debug the "all booked" issue...');
    
    // Test the public listings endpoint (what the search page uses)
    console.log('\n📋 Testing public listings endpoint:');
    const publicResponse = await fetch('http://localhost:8000/api/v1/listings/', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Public listings response status:', publicResponse.status);
    
    if (!publicResponse.ok) {
      const errorText = await publicResponse.text();
      console.error('❌ Public listings API error:', errorText);
      return;
    }
    
    const publicData = await publicResponse.json();
    console.log('✅ Public listings response:', publicData);
    
    const publicListings = publicData.results || publicData || [];
    console.log(`📊 Total public listings found: ${publicListings.length}`);
    
    if (publicListings.length === 0) {
      console.log('❌ NO PUBLIC LISTINGS FOUND! This explains why search shows "all booked"');
      console.log('   This means no listings have approval_status=APPROVED yet');
    } else {
      console.log('✅ Public listings found:');
      publicListings.forEach((listing, index) => {
        console.log(`${index + 1}. "${listing.title}" - $${listing.hourly_rate}/hr`);
        console.log(`   Address: ${listing.address}`);
        console.log(`   Active: ${listing.is_active}`);
        console.log(`   Space Type: ${listing.space_type}`);
        console.log('---');
      });
    }

    // Now let's test with an admin token to see ALL listings (including pending)
    console.log('\n🔐 Testing admin login to see all listings (including pending)...');
    
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
      console.error('❌ No admin access token received');
      return;
    }
    
    const token = loginData.access || loginData.tokens?.access;
    console.log('✅ Got admin token');
    
    // Test admin listings endpoint
    console.log('\n📋 Testing admin listings endpoint to see ALL listings:');
    const adminResponse = await fetch('http://localhost:8000/api/v1/listings/admin/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Admin listings response status:', adminResponse.status);
    
    if (!adminResponse.ok) {
      const errorText = await adminResponse.text();
      console.error('❌ Admin listings API error:', errorText);
      return;
    }
    
    const adminData = await adminResponse.json();
    console.log('✅ Admin listings response:', adminData);
    
    const allListings = adminData.results || adminData || [];
    console.log(`📊 Total listings (all statuses): ${allListings.length}`);
    
    if (allListings.length === 0) {
      console.log('❌ NO LISTINGS FOUND AT ALL! Users need to create some listings first.');
    } else {
      console.log('📋 All listings found:');
      const statusCounts = {};
      
      allListings.forEach((listing, index) => {
        const status = listing.approval_status || 'UNKNOWN';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        
        console.log(`${index + 1}. "${listing.title}" - $${listing.hourly_rate}/hr`);
        console.log(`   Status: ${status}`);
        console.log(`   Active: ${listing.is_active}`);
        console.log(`   Host: ${listing.host_name || listing.host_email}`);
        console.log(`   Created: ${listing.created_at}`);
        console.log('---');
      });
      
      console.log('\n📊 Listing status breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} listings`);
      });
      
      const approvedCount = statusCounts['APPROVED'] || 0;
      const pendingCount = statusCounts['PENDING'] || 0;
      
      if (approvedCount === 0 && pendingCount > 0) {
        console.log('\n🎯 ROOT CAUSE IDENTIFIED:');
        console.log(`   - ${pendingCount} listings exist but they're all PENDING approval`);
        console.log('   - Public search only shows APPROVED listings');
        console.log('   - That\'s why search shows "all booked" - no approved listings exist!');
        console.log('\n💡 SOLUTION:');
        console.log('   - Admin needs to approve some listings in the admin dashboard');
        console.log('   - OR modify the search to show pending listings (not recommended for production)');
      } else if (approvedCount > 0) {
        console.log(`\n✅ Found ${approvedCount} approved listings. The search should be working.`);
        console.log('   The "all booked" issue might be in the availability checking logic.');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testListingsDebug();