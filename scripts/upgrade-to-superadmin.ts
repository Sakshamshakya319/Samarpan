import * as dotenv from 'dotenv';
import * as path from 'path';
import { MongoClient } from 'mongodb';
import bcryptjs from 'bcryptjs';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URL = process.env.MONGODB_URL;
const DB_NAME = 'samarpan';
const ADMINS_COLLECTION = 'admins';

if (!MONGODB_URL) {
  console.error('❌ MONGODB_URL is not defined in .env.local');
  process.exit(1);
}

async function upgradeToSuperAdmin() {
  const client = new MongoClient(MONGODB_URL);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();

    const db = client.db(DB_NAME);
    const adminsCollection = db.collection(ADMINS_COLLECTION);

    // Find existing admin
    console.log('🔍 Looking for admin account: admin@samarpan.com');
    const existingAdmin = await adminsCollection.findOne({
      email: 'admin@samarpan.com'
    });

    if (!existingAdmin) {
      console.error('❌ Admin account not found with email: admin@samarpan.com');
      console.log('💡 Creating new super admin instead...');
      
      const hashedPassword = await bcryptjs.hash('nrt*gam1apt0AZX-gdx', 10);
      
      const result = await adminsCollection.insertOne({
        email: 'admin@samarpan.com',
        password: hashedPassword,
        name: 'Samarpan Super Admin',
        role: 'superadmin',
        permissions: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Super admin created successfully!');
      console.log('📧 Email: admin@samarpan.com');
      console.log('🔐 Password: nrt*gam1apt0AZX-gdx');
      console.log('👤 Account ID: ' + result.insertedId);
    } else {
      console.log('✅ Found existing admin account');
      console.log('   Name: ' + existingAdmin.name);
      console.log('   Current role: ' + existingAdmin.role);
      
      // Upgrade to superadmin
      const result = await adminsCollection.updateOne(
        { email: 'admin@samarpan.com' },
        {
          $set: {
            role: 'superadmin',
            permissions: [],
            status: 'active',
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ Account upgraded to SUPER ADMIN!');
      console.log('📧 Email: admin@samarpan.com');
      console.log('🔐 Password: nrt*gam1apt0AZX-gdx');
    }

    // Create database index on email
    console.log('📑 Creating database index on email field...');
    await adminsCollection.createIndex({ email: 1 }, { unique: true }).catch(() => {
      // Index might already exist, that's fine
    });

    console.log('\n✨ Setup Complete!');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Visit: http://localhost:3000/admin/login');
    console.log('3. Login with:');
    console.log('   📧 Email: admin@samarpan.com');
    console.log('   🔐 Password: nrt*gam1apt0AZX-gdx');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

upgradeToSuperAdmin();