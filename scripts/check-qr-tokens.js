const { MongoClient, ObjectId } = require('mongodb');

async function checkQRTokens() {
  const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan';
  
  let client;
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('samarpan');
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Check event registrations
    const eventRegistrations = db.collection('event_registrations');
    const eventRegCount = await eventRegistrations.countDocuments();
    console.log(`📊 Total event registrations: ${eventRegCount}`);
    
    if (eventRegCount > 0) {
      console.log('\n📋 Recent Event Registrations:');
      const recentEventRegs = await eventRegistrations.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      recentEventRegs.forEach((reg, index) => {
        console.log(`${index + 1}. ${reg.name} - Token: ${reg.alphanumericToken || 'MISSING'} - Status: ${reg.donationStatus} - Verified: ${reg.tokenVerified}`);
      });
      
      // Check for missing tokens
      const missingTokens = await eventRegistrations.countDocuments({
        $or: [
          { alphanumericToken: { $exists: false } },
          { alphanumericToken: null },
          { alphanumericToken: "" }
        ]
      });
      
      if (missingTokens > 0) {
        console.log(`⚠️  ${missingTokens} event registrations are missing alphanumeric tokens!`);
      } else {
        console.log('✅ All event registrations have alphanumeric tokens');
      }
    }
    
    // Check volunteer registrations
    const volunteerRegistrations = db.collection('volunteer_registrations');
    const volunteerRegCount = await volunteerRegistrations.countDocuments();
    console.log(`\n📊 Total volunteer registrations: ${volunteerRegCount}`);
    
    if (volunteerRegCount > 0) {
      console.log('\n📋 Recent Volunteer Registrations:');
      const recentVolunteerRegs = await volunteerRegistrations.find({})
        .sort({ registeredAt: -1 })
        .limit(5)
        .toArray();
      
      recentVolunteerRegs.forEach((reg, index) => {
        console.log(`${index + 1}. ${reg.name} - Token: ${reg.alphanumericToken || 'MISSING'} - Verified: ${reg.tokenVerified}`);
      });
      
      // Check for missing tokens
      const missingVolunteerTokens = await volunteerRegistrations.countDocuments({
        $or: [
          { alphanumericToken: { $exists: false } },
          { alphanumericToken: null },
          { alphanumericToken: "" }
        ]
      });
      
      if (missingVolunteerTokens > 0) {
        console.log(`⚠️  ${missingVolunteerTokens} volunteer registrations are missing alphanumeric tokens!`);
      } else {
        console.log('✅ All volunteer registrations have alphanumeric tokens');
      }
    }
    
    // Test a specific token if provided
    const testToken = process.argv[2];
    if (testToken) {
      console.log(`\n🧪 Testing token: ${testToken}`);
      
      // Check in event registrations
      const eventReg = await eventRegistrations.findOne({ 
        alphanumericToken: testToken.toUpperCase() 
      });
      
      if (eventReg) {
        console.log('✅ Found in event registrations:', {
          name: eventReg.name,
          email: eventReg.email,
          status: eventReg.donationStatus,
          verified: eventReg.tokenVerified,
          eventId: eventReg.eventId
        });
      } else {
        console.log('❌ Not found in event registrations');
      }
      
      // Check in volunteer registrations
      const volunteerReg = await volunteerRegistrations.findOne({ 
        alphanumericToken: testToken.toUpperCase() 
      });
      
      if (volunteerReg) {
        console.log('✅ Found in volunteer registrations:', {
          name: volunteerReg.name,
          email: volunteerReg.email,
          verified: volunteerReg.tokenVerified,
          eventId: volunteerReg.eventId
        });
      } else {
        console.log('❌ Not found in volunteer registrations');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

console.log('🔍 Checking QR tokens in database...');
console.log('Usage: node check-qr-tokens.js [TOKEN_TO_TEST]');
console.log('');

checkQRTokens();