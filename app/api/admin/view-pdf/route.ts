import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/auth"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || request.headers.get("authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAdminToken(token)
    if (!decoded || !["admin", "superadmin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Invalid token or insufficient permissions" }, { status: 401 })
    }

    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    // Security check: ensure the file is in the ngo-documents directory
    if (!filePath.includes('/uploads/ngo-documents/')) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 })
    }

    // Construct the full file path
    const fullPath = join(process.cwd(), 'public', filePath)
    
    console.log('Attempting to serve PDF from:', fullPath)
    
    // Check if file exists before trying to read it
    if (!existsSync(fullPath)) {
      console.error('File not found:', fullPath)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
    
    try {
      const fileBuffer = await readFile(fullPath)
      
      console.log('PDF file read successfully, size:', fileBuffer.length, 'bytes')
      
      // Set comprehensive headers for inline PDF viewing
      const headers = new Headers()
      headers.set('Content-Type', 'application/pdf')
      headers.set('Content-Disposition', 'inline; filename="document.pdf"')
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      headers.set('Pragma', 'no-cache')
      headers.set('Expires', '0')
      headers.set('X-Frame-Options', 'SAMEORIGIN')
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('Content-Security-Policy', "frame-ancestors 'self'")
      headers.set('Accept-Ranges', 'bytes')
      headers.set('Content-Length', fileBuffer.length.toString())
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      })
    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json({ error: "Unable to read file" }, { status: 500 })
    }

  } catch (error) {
    console.error("PDF view error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}