// Test script to check listing edit history and admin activity
const testListingEditHistory = async () => {
  try {
    console.log('🔍 Investigating the "(UPDATED)" in listing title...');
    
    // First, let's get the specific listing with "UPDATED" in the title
    console.log('\n📋 Getting the listing with "UPDATED":');
    const listingsResponse = await fetch('http://localhost:8000/api/v1/listings/', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const listingsData = await listingsResponse.json();
    const listings = listingsData.results || [];
    
    const updatedListing = listings.find(listing => 
      listing.title.toLowerCase().includes('updated')
    );
    
    if (!updatedListing) {
      console.log('❌ No listing with "UPDATED" found in current listings');
      return;
    }
    
    console.log(`✅ Found listing: "${updatedListing.title}" (ID: ${updatedListing.id})`);
    console.log(`   Current title: "${updatedListing.title}"`);
    console.log(`   Host: ${updatedListing.host?.username || 'Unknown'}`);
    
    // Now get admin access to see full listing details including edit history
    console.log('\n🔐 Getting admin access to see edit history...');
    
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
    
    // Get the full admin view of this listing
    console.log('\n📋 Getting admin view of the listing:');
    const adminListingResponse = await fetch(`http://localhost:8000/api/v1/listings/admin/${updatedListing.id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!adminListingResponse.ok) {
      console.error('❌ Admin listing API error:', adminListingResponse.status);
      return;
    }
    
    const adminListingData = await adminListingResponse.json();
    console.log('✅ Admin listing data received');
    console.log(`   Title: "${adminListingData.title}"`);
    console.log(`   Description: "${adminListingData.description}"`);
    console.log(`   Original created: ${adminListingData.created_at}`);
    console.log(`   Last updated: ${adminListingData.updated_at}`);
    console.log(`   Reviewed by: ${adminListingData.reviewed_by_name || 'Not reviewed'}`);
    console.log(`   Reviewed at: ${adminListingData.reviewed_at || 'Not reviewed'}`);
    console.log(`   Admin notes: "${adminListingData.admin_notes || 'None'}"`);
    
    // Check if the title was modified during admin review
    const createdDate = new Date(adminListingData.created_at);
    const updatedDate = new Date(adminListingData.updated_at);
    const reviewedDate = adminListingData.reviewed_at ? new Date(adminListingData.reviewed_at) : null;
    
    console.log('\n📅 Timeline Analysis:');
    console.log(`   Created: ${createdDate.toLocaleString()}`);
    console.log(`   Updated: ${updatedDate.toLocaleString()}`);
    console.log(`   Reviewed: ${reviewedDate ? reviewedDate.toLocaleString() : 'Not reviewed'}`);
    
    const wasEditedAfterCreation = updatedDate.getTime() > createdDate.getTime() + 1000; // Allow 1 second for creation time
    
    if (wasEditedAfterCreation) {
      console.log('\n🎯 ANALYSIS:');
      console.log('   ✅ This listing WAS edited after creation');
      
      if (reviewedDate && Math.abs(updatedDate.getTime() - reviewedDate.getTime()) < 60000) {
        console.log('   🔍 The edit happened around the same time as admin review');
        console.log('   💭 LIKELY CAUSE: Admin edited the listing during the approval process');
        console.log(`   👤 Edited by admin: ${adminListingData.reviewed_by_name}`);
        
        if (adminListingData.admin_notes) {
          console.log(`   📝 Admin notes: "${adminListingData.admin_notes}"`);
        }
      } else {
        console.log('   🔍 The edit happened separate from admin review');
        console.log('   💭 POSSIBLE CAUSES:');
        console.log('     1. Host edited the listing themselves');
        console.log('     2. Admin edited it at a different time');
        console.log('     3. System automatically updated it');
      }
    } else {
      console.log('\n🎯 ANALYSIS:');
      console.log('   ❓ No significant edits detected after creation');
      console.log('   💭 The "(UPDATED)" might have been in the original title');
    }
    
    // Check all admin-managed listings to see if this is a pattern
    console.log('\n📋 Checking if this is a pattern across other listings...');
    const allAdminListingsResponse = await fetch('http://localhost:8000/api/v1/listings/admin/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (allAdminListingsResponse.ok) {
      const allListingsData = await allAdminListingsResponse.json();
      const allListings = allListingsData.results || [];
      
      const listingsWithUpdatedInTitle = allListings.filter(listing => 
        listing.title.toLowerCase().includes('updated')
      );
      
      console.log(`   Found ${listingsWithUpdatedInTitle.length} listings with "updated" in title:`);
      listingsWithUpdatedInTitle.forEach(listing => {
        console.log(`     - "${listing.title}" (ID: ${listing.id}) - Reviewed by: ${listing.reviewed_by_name || 'None'}`);
      });
    }
    
    console.log('\n🔧 RECOMMENDATION:');
    console.log('   If this was an unwanted admin edit:');
    console.log(`   1. Go to admin dashboard: http://localhost:3000/admin`);
    console.log(`   2. Find listing ID ${updatedListing.id}`);
    console.log('   3. Click the eye icon to edit the listing');
    console.log('   4. Change the title back to the original name');
    console.log('   5. Save the changes');
    
  } catch (error) {
    console.error('❌ Investigation error:', error);
  }
};

// Run the investigation
testListingEditHistory();