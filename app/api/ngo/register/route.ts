import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { sendEmail, generateNGORegistrationEmailHTML } from "@/lib/email"
import bcrypt from "bcryptjs"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract form fields
    const ngoData = {
      ngoName: formData.get('ngoName') as string,
      registrationNumber: formData.get('registrationNumber') as string,
      registrationType: formData.get('registrationType') as string,
      yearOfEstablishment: parseInt(formData.get('yearOfEstablishment') as string),
      pincode: formData.get('pincode') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      fullAddress: formData.get('fullAddress') as string,
      contactPerson: {
        name: formData.get('contactPersonName') as string,
        role: formData.get('contactPersonRole') as string,
        mobile: formData.get('contactPersonMobile') as string,
        email: (formData.get('contactPersonEmail') as string).toLowerCase(),
      },
      ngoEmail: (formData.get('ngoEmail') as string).toLowerCase(),
      ngoPhone: formData.get('ngoPhone') as string,
      password: formData.get('password') as string,
      website: formData.get('website') as string || undefined,
      facebookPage: formData.get('facebookPage') as string || undefined,
      instagramPage: formData.get('instagramPage') as string || undefined,
      googleMapsLink: formData.get('googleMapsLink') as string || undefined,
      legalConfirmation: formData.get('legalConfirmation') === 'true',
    }

    // Validate required fields
    if (!ngoData.ngoName || !ngoData.registrationNumber || !ngoData.ngoEmail || !ngoData.password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const ngosCollection = db.collection("ngos")

    // Check if NGO already exists
    const existingNGO = await ngosCollection.findOne({
      $or: [
        { ngoEmail: ngoData.ngoEmail },
        { registrationNumber: ngoData.registrationNumber }
      ]
    })

    if (existingNGO) {
      return NextResponse.json({ error: "NGO with this email or registration number already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ngoData.password, 12)

    // Create uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'ngo-documents')
    await mkdir(uploadsDir, { recursive: true })

    // Handle file uploads
    const documents: any = {}
    const fileFields = [
      'registrationCertificate',
      'bloodBankLicense', 
      'panCard',
      'addressProof',
      'idProof',
      'certificate80G',
      'certificate12A'
    ]

    for (const field of fileFields) {
      const file = formData.get(field) as File
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Generate unique filename
        const timestamp = Date.now()
        const filename = `${field}_${timestamp}_${file.name}`
        const filepath = join(uploadsDir, filename)
        
        await writeFile(filepath, buffer)
        documents[field] = `/uploads/ngo-documents/${filename}`
      }
    }

    // Create NGO record
    const ngoRecord = {
      ...ngoData,
      password: hashedPassword,
      documents,
      status: 'pending' as const,
      role: 'ngo' as const,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('Creating NGO record:', { 
      ngoName: ngoRecord.ngoName, 
      email: ngoRecord.ngoEmail,
      status: ngoRecord.status 
    })

    const result = await ngosCollection.insertOne(ngoRecord)
    console.log('NGO record created with ID:', result.insertedId)

    // Send confirmation email to NGO
    try {
      const emailHTML = generateNGORegistrationEmailHTML({
        ngoName: ngoData.ngoName,
        contactPersonName: ngoData.contactPerson.name,
      })

      await sendEmail({
        to: ngoData.ngoEmail,
        subject: "NGO Registration Received - Samarpan",
        html: emailHTML,
      })
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError)
    }

    // Send notification to admin
    try {
      const adminEmailHTML = `
        <h2>New NGO Registration</h2>
        <p>A new NGO has registered and requires review:</p>
        <ul>
          <li><strong>NGO Name:</strong> ${ngoData.ngoName}</li>
          <li><strong>Registration Number:</strong> ${ngoData.registrationNumber}</li>
          <li><strong>Contact Person:</strong> ${ngoData.contactPerson.name}</li>
          <li><strong>Email:</strong> ${ngoData.ngoEmail}</li>
          <li><strong>Location:</strong> ${ngoData.city}, ${ngoData.state}</li>
        </ul>
        <p>Please review the application in the admin panel.</p>
      `

      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@samarpan.com",
        subject: "New NGO Registration - Review Required",
        html: adminEmailHTML,
      })
    } catch (adminEmailError) {
      console.error("Failed to send admin notification:", adminEmailError)
    }

    return NextResponse.json(
      { 
        message: "NGO registration submitted successfully",
        ngoId: result.insertedId 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("NGO registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}