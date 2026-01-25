export interface NGORegistration {
  _id?: string
  // Basic Info
  ngoName: string
  registrationNumber: string
  registrationType: 'trust' | 'society' | 'section8'
  yearOfEstablishment: number
  
  // Address
  pincode: string
  city: string
  state: string
  fullAddress: string
  
  // Contact Person
  contactPerson: {
    name: string
    role: string
    mobile: string
    email: string
    idProof?: string // file path
  }
  
  // NGO Contact
  ngoEmail: string
  ngoPhone: string
  
  // Optional Info
  website?: string
  facebookPage?: string
  instagramPage?: string
  googleMapsLink?: string
  
  // Documents (all required)
  documents: {
    registrationCertificate?: string // file path
    bloodBankLicense?: string // file path
    panCard?: string // file path
    addressProof?: string // file path
    certificate80G?: string // file path (optional)
    certificate12A?: string // file path (optional)
  }
  
  // Status & Verification
  status: 'pending' | 'approved' | 'rejected'
  role: 'ngo'
  isVerified: boolean
  
  // Pause/Resume Functionality
  isPaused: boolean
  pausedBy?: string // admin ID who paused
  pausedAt?: Date
  pauseReason?: string
  resumedBy?: string // admin ID who resumed
  resumedAt?: Date
  
  // Admin Review
  reviewedBy?: string // admin ID
  reviewedAt?: Date
  rejectionReason?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Login Credentials (hashed)
  password: string
  
  // Legal Confirmation
  legalConfirmation: boolean
}

export interface PincodeResponse {
  Message: string
  Status: string
  PostOffice: Array<{
    Name: string
    Description: string
    BranchType: string
    DeliveryStatus: string
    Circle: string
    District: string
    Division: string
    Region: string
    Block: string
    State: string
    Country: string
    Pincode: string
  }>
}