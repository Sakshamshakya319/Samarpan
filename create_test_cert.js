
const { MongoClient, ObjectId } = require('mongodb');

async function createTestCertificate() {
  const uri = "mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("samarpan");
    const certificatesCollection = db.collection("volunteer_certificates");
    
    const testId = "VC-TEST-" + Date.now();
    
    console.log(`Creating test certificate with ID: ${testId}`);
    
    const result = await certificatesCollection.insertOne({
      certificateId: testId,
      certificateToken: "TEST-TOKEN",
      type: "volunteer",
      issuedDate: new Date(),
      status: "active",
      isTest: true
    });
    
    console.log("Insert result:", result);
    
    // Verify it exists
    const found = await certificatesCollection.findOne({ certificateId: testId });
    if (found) {
        console.log("Verification: Certificate successfully saved and retrieved.");
    } else {
        console.error("Verification FAILED: Certificate not found after insert.");
    }

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.close();
  }
}

createTestCertificate();
