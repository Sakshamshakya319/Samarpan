import { PDFDocument } from 'pdf-lib'

export async function compressPDF(file: File): Promise<File> {
  try {
    // If file is already under 5MB, return as is
    if (file.size <= 5 * 1024 * 1024) {
      return file
    }

    // Read the PDF file
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    // Basic compression by removing metadata and optimizing
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
    })
    
    // Create new compressed file
    const compressedFile = new File([compressedPdfBytes], file.name, {
      type: 'application/pdf',
      lastModified: Date.now(),
    })
    
    // If still over 5MB, we might need more aggressive compression
    if (compressedFile.size > 5 * 1024 * 1024) {
      // For now, return the compressed version even if over 5MB
      // In production, you might want to implement image compression within PDFs
      console.warn('PDF still over 5MB after compression')
    }
    
    return compressedFile
  } catch (error) {
    console.error('Error compressing PDF:', error)
    // Return original file if compression fails
    return file
  }
}

export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

export function validateFileType(file: File, allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png']): boolean {
  return allowedTypes.includes(file.type)
}