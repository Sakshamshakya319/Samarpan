const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function checkAdmins() {
  const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan';
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URL not found in environment variables');
    return;
  }

  let client;
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('samarpan');
    const adminsCollection = db.collection('admins');
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Check existing admins
    const adminCount = await adminsCollection.countDocuments();
    console.log(`📊 Total admins in database: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('⚠️  No admin accounts found. Creating default admin...');
      
      // Create default admin
      const defaultPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      const result = await adminsCollection.insertOne({
        email: 'admin@samarpan.com',
        password: hashedPassword,
        name: 'Default Admin',
        role: 'superadmin',
        permissions: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Default admin created successfully!');
      console.log('📧 Email: admin@samarpan.com');
      console.log('🔑 Password: admin123');
      console.log('🆔 ID:', result.insertedId);
    } else {
      console.log('📋 Existing admins:');
      const admins = await adminsCollection.find({}, { 
        projection: { password: 0 } // Don't show passwords
      }).toArray();
      
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email} (${admin.role}) - Status: ${admin.status}`);
      });
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

checkAdmins();