
const { MongoClient } = require('mongodb');

async function checkCertificate() {
  const uri = "mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan";
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    // The database name is usually in the connection string or default.
    // The connection string doesn't specify a db name in the path (it has query params).
    // Let's list databases to be sure, or just try "samarpan" or "test".
    
    const dbName = "samarpan"; // Guessing based on previous context, or "test" is default for Atlas
    const db = client.db(dbName);
    
    console.log(`Connected to database: ${db.databaseName}`);
    
    const volunteerCertificates = db.collection("volunteer_certificates");
    
    console.log("Searching for VC-39394240...");
    const cert = await volunteerCertificates.findOne({ certificateId: "VC-39394240" });
    
    if (cert) {
      console.log("Certificate found:", JSON.stringify(cert, null, 2));
    } else {
      console.log("Certificate NOT found with certificateId: VC-39394240");
      
      // List all collections to make sure we are in the right DB
      const collections = await db.listCollections().toArray();
      console.log("Collections:", collections.map(c => c.name));

      // Try to find ANY certificate to see structure
      const anyCert = await volunteerCertificates.findOne({});
      if (anyCert) {
          console.log("Sample certificate:", JSON.stringify(anyCert, null, 2));
      } else {
          console.log("No certificates found in volunteer_certificates collection.");
      }
    }

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

checkCertificate();
