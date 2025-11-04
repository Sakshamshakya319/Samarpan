import * as dotenv from 'dotenv';
import * as path from 'path';
import { MongoClient } from 'mongodb';
import bcryptjs from 'bcryptjs';

// Load environment variables from .env.local FIRST before anything else
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URL = process.env.MONGODB_URL;
const DB_NAME = 'samarpan';
const ADMINS_COLLECTION = 'admins';

if (!MONGODB_URL) {
  console.error('❌ MONGODB_URL is not defined in .env.local');
  console.error('Please make sure .env.local has MONGODB_URL configured');
  process.exit(1);
}

/**
 * Setup script to initialize or update admin system in MongoDB
 * This ensures admin@samarpan.com exists as super admin with proper structure
 */
async function setupAdminSystem() {
  const client = new MongoClient(MONGODB_URL);

  try {
    console.log("\n🔧 Setting up Admin System...\n")
    console.log('🔗 Connecting to MongoDB...')
    await client.connect()
    
    const db = client.db(DB_NAME);
    const adminsCollection = db.collection(ADMINS_COLLECTION)

    // Create indexes for better query performance
    console.log('📑 Creating database indexes...')
    await adminsCollection.createIndex({ email: 1 }, { unique: true }).catch(() => {})
    await adminsCollection.createIndex({ role: 1 }).catch(() => {})
    await adminsCollection.createIndex({ createdAt: -1 }).catch(() => {})
    console.log("✓ Database indexes created")

    // Check if super admin exists
    const superAdmin = await adminsCollection.findOne({
      email: "admin@samarpan.com",
    })

    if (superAdmin) {
      console.log("✓ Super admin found: admin@samarpan.com")

      // Update to ensure proper role and structure
      const updateResult = await adminsCollection.updateOne(
        { email: "admin@samarpan.com" },
        {
          $set: {
            role: "superadmin",
            permissions: [],
            status: "active",
            updatedAt: new Date(),
          },
        }
      )

      if (updateResult.modifiedCount > 0) {
        console.log("✓ Updated admin role and structure")
      }
    } else {
      // Create new super admin
      console.log("Creating new super admin account...\n")
      const hashedPassword = await bcryptjs.hash("admin@123", 10)

      const result = await adminsCollection.insertOne({
        email: "admin@samarpan.com",
        password: hashedPassword,
        name: "Samarpan Admin",
        role: "superadmin",
        permissions: [],
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      console.log("✅ Super admin created successfully!")
      console.log("   Email: admin@samarpan.com")
      console.log("   Password: admin@123")
      console.log("   ID: " + result.insertedId)
    }

    // Display admin summary
    const totalAdmins = await adminsCollection.countDocuments()
    const superAdmins = await adminsCollection.countDocuments({
      role: "superadmin",
    })
    const regularAdmins = await adminsCollection.countDocuments({
      role: "admin",
    })

    console.log("\n📊 Admin System Summary:")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`Total Admins: ${totalAdmins}`)
    console.log(`Super Admins: ${superAdmins}`)
    console.log(`Regular Admins: ${regularAdmins}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    console.log("✅ Admin system setup complete!\n")
    console.log("📝 Login Information:")
    console.log("   URL: http://localhost:3000/admin/login")
    console.log("   Email: admin@samarpan.com")
    console.log("   Password: admin@123\n")
    console.log("📌 Next Steps:")
    console.log(
      "   1. Start the dev server: npm run dev"
    )
    console.log("   2. Login with the super admin account")
    console.log("   3. Create new admins with selected features\n")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error setting up admin system:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

setupAdminSystem()