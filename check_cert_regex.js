
const { MongoClient } = require('mongodb');

async function checkCertificate() {
  const uri = "mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("samarpan");
    
    const volunteerCertificates = db.collection("volunteer_certificates");
    const donationCertificates = db.collection("certificates");
    
    const searchTerm = "39394240";
    console.log(`Searching for *${searchTerm}*...`);
    
    // Search in volunteer_certificates
    const volCert = await volunteerCertificates.findOne({ 
      certificateId: { $regex: searchTerm } 
    });
    
    if (volCert) {
      console.log("Found in volunteer_certificates:", JSON.stringify(volCert, null, 2));
    } else {
      console.log("Not found in volunteer_certificates (regex match).");
    }

    // Search in donationCertificates
    const donCert = await donationCertificates.findOne({ 
      certificateId: { $regex: searchTerm } 
    });

    if (donCert) {
      console.log("Found in donationCertificates:", JSON.stringify(donCert, null, 2));
    } else {
      console.log("Not found in donationCertificates (regex match).");
    }
    
    // Check if there are ANY volunteer certs created recently
    const recentVolCerts = await volunteerCertificates.find().sort({_id: -1}).limit(3).toArray();
    console.log("Recent 3 volunteer certificates IDs:", recentVolCerts.map(c => c.certificateId));

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

checkCertificate();
