// Test script to check verification requests API
const testVerificationAPI = async () => {
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
    
    // Test verification requests endpoint
    console.log('📋 Testing verification requests endpoint...');
    const verificationResponse = await fetch('http://localhost:8000/api/v1/users/admin/verification-requests/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Verification response status:', verificationResponse.status);
    console.log('Verification response headers:', Object.fromEntries(verificationResponse.headers.entries()));
    
    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text();
      console.error('❌ Verification API error:', errorText);
      return;
    }
    
    const verificationData = await verificationResponse.json();
    console.log('✅ Verification API response:', verificationData);
    
    const allRequests = verificationData.results || verificationData || [];
    console.log('📊 Total verification requests:', allRequests.length);
    
    allRequests.forEach((request, index) => {
      console.log(`${index + 1}. Verification ID: ${request.id}`);
      console.log(`   User: ${request.user_display_name}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   can_be_reviewed: ${request.can_be_reviewed}`);
      console.log(`   Type: ${request.verification_type}`);
      console.log('   Full request:', request);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testVerificationAPI();