/**
 * Simple test to verify API endpoints are working
 * This script tests the API endpoints without authentication to check basic functionality
 */

const BASE_URL = 'http://localhost:3000'

async function testApiEndpoints() {
  console.log("Testing API endpoints...")
  
  try {
    // Test 1: Public events API (should work without auth)
    console.log("\n1. Testing public events API...")
    
    const publicResponse = await fetch(`${BASE_URL}/api/events`)
    console.log(`Public events API status: ${publicResponse.status}`)
    
    if (publicResponse.ok) {
      const publicData = await publicResponse.json()
      console.log(`✓ Public events API returned ${publicData.events?.length || 0} events`)
      
      if (publicData.events && publicData.events.length > 0) {
        const sampleEvent = publicData.events[0]
        console.log(`   Sample event: "${sampleEvent.title}"`)
        console.log(`   Event types: ${Array.isArray(sampleEvent.eventTypes) ? sampleEvent.eventTypes.join(", ") : sampleEvent.eventType || "N/A"}`)
        console.log(`   NGO Name: ${sampleEvent.ngoName || "N/A"}`)
      }
    } else {
      console.log(`✗ Public events API failed: ${publicResponse.statusText}`)
    }
    
    // Test 2: Admin events API (should require auth)
    console.log("\n2. Testing admin events API (without auth)...")
    
    const adminResponse = await fetch(`${BASE_URL}/api/admin/events`)
    console.log(`Admin events API status: ${adminResponse.status}`)
    
    if (adminResponse.status === 401) {
      console.log("✓ Admin events API correctly requires authentication")
    } else {
      console.log(`⚠️  Admin events API returned unexpected status: ${adminResponse.status}`)
    }
    
    // Test 3: Admin NGO events API (should require auth)
    console.log("\n3. Testing admin NGO events API (without auth)...")
    
    const adminNgoResponse = await fetch(`${BASE_URL}/api/admin/ngo-events`)
    console.log(`Admin NGO events API status: ${adminNgoResponse.status}`)
    
    if (adminNgoResponse.status === 401) {
      console.log("✓ Admin NGO events API correctly requires authentication")
    } else {
      console.log(`⚠️  Admin NGO events API returned unexpected status: ${adminNgoResponse.status}`)
    }
    
    console.log("\n✅ API endpoints test completed!")
    
  } catch (error) {
    console.error("API test failed:", error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log("\n⚠️  Connection refused - make sure the development server is running:")
      console.log("   npm run dev")
      console.log("   or")
      console.log("   yarn dev")
    }
  }
}

// Run test
testApiEndpoints()