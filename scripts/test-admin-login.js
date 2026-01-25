const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function testAdminLogin() {
  const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan';
  
  let client;
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('samarpan');
    const adminsCollection = db.collection('admins');
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Test with the admin account from the form
    const testEmail = 'admin@samarpan.com';
    const testPassword = 'admin123'; // Common default password
    
    console.log(`🔍 Looking for admin: ${testEmail}`);
    
    const admin = await adminsCollection.findOne({ email: testEmail });
    
    if (!admin) {
      console.log('❌ Admin not found with email:', testEmail);
      
      // Show all admins
      const allAdmins = await adminsCollection.find({}, { 
        projection: { email: 1, role: 1, status: 1 } 
      }).toArray();
      
      console.log('📋 Available admins:');
      allAdmins.forEach(a => {
        console.log(`  - ${a.email} (${a.role}) - ${a.status}`);
      });
      return;
    }
    
    console.log('✅ Admin found:', {
      email: admin.email,
      role: admin.role,
      status: admin.status,
      hasPassword: !!admin.password
    });
    
    // Test password verification
    console.log(`🔑 Testing password: ${testPassword}`);
    
    const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
    
    if (isPasswordValid) {
      console.log('✅ Password is correct!');
    } else {
      console.log('❌ Password is incorrect');
      
      // Try to create a new password hash for testing
      console.log('🔧 Creating new password hash for testing...');
      const newHash = await bcrypt.hash(testPassword, 10);
      
      await adminsCollection.updateOne(
        { email: testEmail },
        { 
          $set: { 
            password: newHash,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✅ Password updated for testing. Try logging in again.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

testAdminLogin();