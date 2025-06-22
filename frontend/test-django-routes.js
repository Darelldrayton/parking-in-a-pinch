// Test Django API routes to understand the 405 error
const testDjangoRoutes = async () => {
  try {
    console.log('🔍 Testing Django API routes to understand the 405 error...');
    
    // Test the main API endpoint
    console.log('\n📋 Testing main API endpoint:');
    const apiResponse = await fetch('http://localhost:8000/api/v1/', {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('API root OPTIONS status:', apiResponse.status);
    console.log('API root headers:', Object.fromEntries(apiResponse.headers.entries()));
    
    // Test users endpoint
    console.log('\n📋 Testing users endpoint:');
    const usersResponse = await fetch('http://localhost:8000/api/v1/users/', {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Users OPTIONS status:', usersResponse.status);
    console.log('Users allowed methods:', usersResponse.headers.get('Allow'));
    
    // Test verification requests endpoint specifically
    console.log('\n📋 Testing verification-requests endpoint:');
    const verificationResponse = await fetch('http://localhost:8000/api/v1/users/verification-requests/', {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Verification OPTIONS status:', verificationResponse.status);
    console.log('Verification allowed methods:', verificationResponse.headers.get('Allow'));
    
    // Test if the URL pattern is correct
    console.log('\n📋 Testing different URL patterns:');
    
    const patterns = [
      'http://localhost:8000/api/v1/users/verification-requests/',
      'http://localhost:8000/api/v1/verification-requests/',
      'http://localhost:8000/api/v1/users/verification/',
    ];
    
    for (const pattern of patterns) {
      try {
        const response = await fetch(pattern, {
          method: 'OPTIONS',
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`${pattern}:`);
        console.log(`  Status: ${response.status}`);
        console.log(`  Allow: ${response.headers.get('Allow') || 'Not specified'}`);
      } catch (error) {
        console.log(`${pattern}: Connection error`);
      }
    }
    
    // Check if the ViewSet is properly registered
    console.log('\n🔍 ANALYSIS:');
    console.log('The verification-requests endpoint exists but POST method is not allowed.');
    console.log('This suggests either:');
    console.log('1. The ViewSet is not properly inheriting from ModelViewSet');
    console.log('2. The create action is explicitly disabled');
    console.log('3. There is a routing configuration issue');
    console.log('4. The http_method_names is restricted');
    
    console.log('\n💡 SOLUTION NEEDED:');
    console.log('Need to check the VerificationRequestViewSet in Django to enable POST method.');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testDjangoRoutes();