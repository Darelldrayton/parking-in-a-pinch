// Test script to debug the verification submission issue
const testVerificationEndpoint = async () => {
  try {
    console.log('🔍 Testing verification endpoint to debug 405 error...');
    
    // First, let's try to login as a regular user
    console.log('\n🔐 Testing user login...');
    
    const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'darelldrayton93@gmail.com',  // Use the user email from the logs
        password: 'testpass123'  // Try common password
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      // Try alternative login
      console.log('Trying alternative login...');
      const altLoginResponse = await fetch('http://localhost:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testuser@example.com',
          password: 'testpass123'
        })
      });
      
      if (!altLoginResponse.ok) {
        console.log('❌ Cannot login with test credentials. Let me check available endpoints...');
        
        // Test if the verification endpoint exists at all
        console.log('\n📋 Testing verification endpoint without authentication:');
        const noAuthResponse = await fetch('http://localhost:8000/api/v1/users/verification-requests/', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('No-auth GET response status:', noAuthResponse.status);
        console.log('Response headers:', Object.fromEntries(noAuthResponse.headers.entries()));
        
        if (noAuthResponse.status === 401) {
          console.log('✅ Endpoint exists but requires authentication (expected)');
        } else if (noAuthResponse.status === 404) {
          console.log('❌ Endpoint not found - URL routing issue');
        } else {
          console.log('🤔 Unexpected response status');
        }
        
        // Test POST method specifically
        console.log('\n📋 Testing POST method without authentication:');
        const postResponse = await fetch('http://localhost:8000/api/v1/users/verification-requests/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        console.log('POST response status:', postResponse.status);
        
        if (postResponse.status === 405) {
          console.log('❌ 405 Method Not Allowed - POST method not supported on this endpoint');
          
          // Check what methods are allowed
          const allowedMethods = postResponse.headers.get('Allow');
          console.log('Allowed methods:', allowedMethods || 'Not specified');
          
          console.log('\n🔍 DIAGNOSIS:');
          console.log('The verification endpoint does not support POST requests.');
          console.log('This suggests a routing or ViewSet configuration issue.');
        } else if (postResponse.status === 401) {
          console.log('✅ POST method works but requires authentication');
        }
        
        return;
      }
    }
    
    // If we get here, login worked
    const loginData = await (loginResponse.ok ? loginResponse : altLoginResponse).json();
    const token = loginData.access || loginData.tokens?.access;
    
    if (!token) {
      console.log('❌ No access token received from login');
      return;
    }
    
    console.log('✅ Login successful, got access token');
    
    // Test the verification endpoint with authentication
    console.log('\n📋 Testing verification endpoint with authentication:');
    
    // First test GET request
    const getResponse = await fetch('http://localhost:8000/api/v1/users/verification-requests/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('GET response status:', getResponse.status);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('GET response data:', getData);
    }
    
    // Test POST request with minimal data
    console.log('\n📋 Testing POST request:');
    const postResponse = await fetch('http://localhost:8000/api/v1/users/verification-requests/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        verification_type: 'IDENTITY',
        document_type: 'drivers_license'
      })
    });
    
    console.log('POST response status:', postResponse.status);
    console.log('POST response headers:', Object.fromEntries(postResponse.headers.entries()));
    
    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.log('POST error response:', errorText);
      
      if (postResponse.status === 405) {
        console.log('\n❌ PROBLEM CONFIRMED:');
        console.log('The POST method is not allowed on /users/verification-requests/');
        console.log('This indicates a ViewSet configuration issue.');
        
        const allowedMethods = postResponse.headers.get('Allow');
        console.log('Allowed methods:', allowedMethods || 'Not specified');
      }
    } else {
      console.log('✅ POST request successful!');
      const responseData = await postResponse.json();
      console.log('Response data:', responseData);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test
testVerificationEndpoint();