// API Connection Test Script
// Run this in your browser console to test the API connection

console.log('Testing API Connection...');
console.log('Current API URL:', import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/v1');

// Test login endpoint
async function testLogin() {
    try {
        const response = await fetch('http://localhost:8000/api/v1/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'darelldrayton93@gmail.com',
                password: 'temppass123'
            })
        });
        
        const data = await response.json();
        console.log('Login Success:', data);
        
        // Save tokens for testing
        if (data.access) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Tokens saved to localStorage!');
            console.log('You can now reload the page and you should be logged in.');
        }
    } catch (error) {
        console.error('Login Error:', error);
    }
}

// Run the test
testLogin();