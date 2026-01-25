
const { MongoClient } = require('mongodb');

async function checkCertificate() {
  const uri = "mongodb+srv://saksham:phmbjkvjOzw37KhZ@samarpan.j05aoqs.mongodb.net/?appName=Samarpan";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("samarpan");
    
    const volunteerRegistrations = db.collection("volunteer_registrations");
    
    const searchTerm = "39394240";
    console.log(`Searching for registration with certificateId containing *${searchTerm}*...`);
    
    const reg = await volunteerRegistrations.findOne({ 
      certificateId: { $regex: searchTerm } 
    });
    
    if (reg) {
      console.log("Found registration:", JSON.stringify(reg, null, 2));
    } else {
      console.log("Not found in volunteer_registrations.");
    }

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

checkCertificate();
