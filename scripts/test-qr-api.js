const { default: fetch } = require('node-fetch');

async function testQRAPI() {
  const baseURL = 'http://localhost:3000';
  const testToken = '7JTQJJ'; // Token we know exists
  
  // First, let's get an admin token
  console.log('🔐 Getting admin token...');
  
  try {
    const loginResponse = await fetch(`${baseURL}/api/auth/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@samarpan.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Admin login failed:', loginData);
      return;
    }
    
    console.log('✅ Admin login successful');
    const adminToken = loginData.token;
    
    // Test GET request (lookup registration)
    console.log(`\n🔍 Testing GET request for token: ${testToken}`);
    
    const getResponse = await fetch(`${baseURL}/api/event-registrations/qr-verify?alphanumericToken=${testToken}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📡 GET Response status:', getResponse.status);
    console.log('📡 GET Response headers:', Object.fromEntries(getResponse.headers.entries()));
    
    const getData = await getResponse.json();
    console.log('📦 GET Response data:', JSON.stringify(getData, null, 2));
    
    if (getResponse.ok) {
      console.log('✅ GET request successful - Registration found!');
      
      // Test POST request (verify registration)
      console.log(`\n✅ Testing POST request to verify token: ${testToken}`);
      
      const postResponse = await fetch(`${baseURL}/api/event-registrations/qr-verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alphanumericToken: testToken
        })
      });
      
      console.log('📡 POST Response status:', postResponse.status);
      console.log('📡 POST Response headers:', Object.fromEntries(postResponse.headers.entries()));
      
      const postData = await postResponse.json();
      console.log('📦 POST Response data:', JSON.stringify(postData, null, 2));
      
      if (postResponse.ok) {
        console.log('✅ POST request successful - Registration verified!');
      } else {
        console.log('❌ POST request failed');
      }
    } else {
      console.log('❌ GET request failed');
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

console.log('🧪 Testing QR API endpoints...');
console.log('');

testQRAPI();