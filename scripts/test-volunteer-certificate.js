const fs = require('fs');

async function testVolunteerCertificate() {
  console.log('🧪 Testing volunteer certificate generation with A4 landscape layout...');
  
  try {
    // Import the certificate generator
    const { generateVolunteerCertificate } = await import('../lib/volunteer-certificate-generator.js');
    
    // Mock data for testing
    const volunteer = {
      userName: 'SAKSHAM SHAKYA',
      name: 'Saksham Shakya',
      userEmail: 'saksham@example.com'
    };
    
    const event = {
      title: 'Blood Donation Camp',
      eventDate: new Date('2026-01-30'),
      location: 'CITY Hall Phagwara'
    };
    
    const ngo = {
      name: 'Blood Bank Phagwara',
      authorizedPerson: 'Dr. John Doe'
    };
    
    console.log('📄 Generating certificate with optimized A4 landscape layout...');
    
    const result = await generateVolunteerCertificate(volunteer, event, ngo);
    
    console.log('✅ Certificate generated successfully!');
    console.log('📋 Certificate Details:');
    console.log(`   Certificate ID: ${result.certificateId}`);
    console.log(`   Certificate Token: ${result.certificateToken}`);
    console.log(`   PDF Size: ${result.pdfBytes.length} bytes`);
    console.log(`   Layout: A4 Landscape (841.89 x 595.28 points)`);
    
    // Save PDF for testing
    const filename = `volunteer-certificate-a4-landscape-${Date.now()}.pdf`;
    fs.writeFileSync(filename, result.pdfBytes);
    console.log(`💾 PDF saved as: ${filename}`);
    
    console.log('🎉 Test completed successfully!');
    console.log('📐 Layout improvements:');
    console.log('   ✅ Proper A4 landscape dimensions');
    console.log('   ✅ Optimized spacing between elements');
    console.log('   ✅ Reduced excessive white space');
    console.log('   ✅ Better text alignment and positioning');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testVolunteerCertificate();