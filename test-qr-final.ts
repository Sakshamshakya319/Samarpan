import { generateAdminToken } from './lib/auth'

// Test the QR verification API with admin token
async function testQRVerification() {
  console.log('Testing QR Verification API...')
  
  // Generate a test admin token
  const testAdminToken = generateAdminToken('test-admin-id', 'admin', 'test@admin.com')
  console.log('Generated test admin token:', testAdminToken)
  
  // Test GET endpoint
  console.log('\nTesting GET endpoint...')
  try {
    const getResponse = await fetch('http://localhost:3000/api/event-registrations/qr-verify?qrToken=test-qr-token', {
      headers: {
        'Authorization': `Bearer ${testAdminToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('GET Response status:', getResponse.status)
    const getData = await getResponse.json()
    console.log('GET Response data:', getData)
  } catch (error) {
    console.error('GET request error:', error)
  }
  
  // Test POST endpoint
  console.log('\nTesting POST endpoint...')
  try {
    const postResponse = await fetch('http://localhost:3000/api/event-registrations/qr-verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qrToken: 'test-qr-token'
      })
    })
    
    console.log('POST Response status:', postResponse.status)
    const postData = await postResponse.json()
    console.log('POST Response data:', postData)
  } catch (error) {
    console.error('POST request error:', error)
  }
}

// Run the test
testQRVerification().catch(console.error)