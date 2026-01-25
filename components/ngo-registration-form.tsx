"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, Building, MapPin, User, Mail, Phone, Globe } from "lucide-react"
import { fetchLocationByPincode } from "@/lib/pincode-api"
import { compressPDF, validateFileSize, validateFileType } from "@/lib/pdf-compression"

interface FormData {
  // Basic Info
  ngoName: string
  registrationNumber: string
  registrationType: 'trust' | 'society' | 'section8' | ''
  yearOfEstablishment: string
  
  // Address
  pincode: string
  city: string
  state: string
  fullAddress: string
  
  // Contact Person
  contactPersonName: string
  contactPersonRole: string
  contactPersonMobile: string
  contactPersonEmail: string
  
  // NGO Contact
  ngoEmail: string
  ngoPhone: string
  password: string
  confirmPassword: string
  
  // Optional Info
  website: string
  facebookPage: string
  instagramPage: string
  googleMapsLink: string
  
  // Legal Confirmation
  legalConfirmation: boolean
}

interface UploadedFiles {
  registrationCertificate: File | null
  bloodBankLicense: File | null
  panCard: File | null
  addressProof: File | null
  idProof: File | null
  certificate80G: File | null
  certificate12A: File | null
}

export function NGORegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    ngoName: '',
    registrationNumber: '',
    registrationType: '',
    yearOfEstablishment: '',
    pincode: '',
    city: '',
    state: '',
    fullAddress: '',
    contactPersonName: '',
    contactPersonRole: '',
    contactPersonMobile: '',
    contactPersonEmail: '',
    ngoEmail: '',
    ngoPhone: '',
    password: '',
    confirmPassword: '',
    website: '',
    facebookPage: '',
    instagramPage: '',
    googleMapsLink: '',
    legalConfirmation: false
  })

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    registrationCertificate: null,
    bloodBankLicense: null,
    panCard: null,
    addressProof: null,
    idProof: null,
    certificate80G: null,
    certificate12A: null
  })

  const [isLoading, setIsLoading] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentStep, setCurrentStep] = useState(1)

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePincodeChange = async (pincode: string) => {
    handleInputChange('pincode', pincode)
    
    if (pincode.length === 6) {
      setPincodeLoading(true)
      try {
        const location = await fetchLocationByPincode(pincode)
        if (location) {
          setFormData(prev => ({
            ...prev,
            city: location.city,
            state: location.state
          }))
        } else {
          setError('Invalid pincode or location not found')
        }
      } catch (err) {
        setError('Error fetching location data')
      } finally {
        setPincodeLoading(false)
      }
    } else {
      setFormData(prev => ({ ...prev, city: '', state: '' }))
    }
  }

  const handleFileUpload = async (field: keyof UploadedFiles, file: File) => {
    try {
      // Validate file type
      if (!validateFileType(file)) {
        setError('Please upload PDF, JPG, or PNG files only')
        return
      }

      let processedFile = file

      // Compress PDF if needed
      if (file.type === 'application/pdf') {
        processedFile = await compressPDF(file)
      }

      // Validate file size after compression
      if (!validateFileSize(processedFile)) {
        setError('File size must be under 5MB')
        return
      }

      setUploadedFiles(prev => ({ ...prev, [field]: processedFile }))
      setError('')
    } catch (err) {
      setError('Error processing file')
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.ngoName && formData.registrationNumber && formData.registrationType && formData.yearOfEstablishment)
      case 2:
        return !!(formData.pincode && formData.city && formData.state && formData.fullAddress)
      case 3:
        return !!(formData.contactPersonName && formData.contactPersonRole && formData.contactPersonMobile && formData.contactPersonEmail)
      case 4:
        return !!(formData.ngoEmail && formData.ngoPhone && formData.password && formData.confirmPassword && formData.password === formData.confirmPassword)
      case 5:
        return !!(uploadedFiles.registrationCertificate && uploadedFiles.bloodBankLicense && uploadedFiles.panCard && uploadedFiles.addressProof && uploadedFiles.idProof)
      case 6:
        return formData.legalConfirmation
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(6)) {
      setError('Please complete all required fields and accept the legal confirmation')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString())
      })

      // Add files
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(key, file)
        }
      })

      const response = await fetch('/api/ngo/register', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        setSuccess('NGO registration submitted successfully! You will receive an email once your application is reviewed.')
        // Reset form
        setFormData({
          ngoName: '',
          registrationNumber: '',
          registrationType: '',
          yearOfEstablishment: '',
          pincode: '',
          city: '',
          state: '',
          fullAddress: '',
          contactPersonName: '',
          contactPersonRole: '',
          contactPersonMobile: '',
          contactPersonEmail: '',
          ngoEmail: '',
          ngoPhone: '',
          password: '',
          confirmPassword: '',
          website: '',
          facebookPage: '',
          instagramPage: '',
          googleMapsLink: '',
          legalConfirmation: false
        })
        setUploadedFiles({
          registrationCertificate: null,
          bloodBankLicense: null,
          panCard: null,
          addressProof: null,
          idProof: null,
          certificate80G: null,
          certificate12A: null
        })
        setCurrentStep(1)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Registration failed')
      }
    } catch (err) {
      setError('Error submitting registration')
    } finally {
      setIsLoading(false)
    }
  }

  const FileUploadField = ({ 
    field, 
    label, 
    required = false, 
    description 
  }: { 
    field: keyof UploadedFiles
    label: string
    required?: boolean
    description?: string 
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(field, file)
          }}
          className="hidden"
          id={field}
        />
        <label
          htmlFor={field}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
        >
          <Upload className="w-4 h-4" />
          Choose File
        </label>
        {uploadedFiles[field] && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">{uploadedFiles[field]?.name}</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-gray-900 mb-2">NGO Registration</h1>
          <p className="text-gray-600 text-lg">Join Samarpan as a verified NGO partner</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 6 && <div className={`w-8 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Form Steps */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {currentStep === 1 && <><Building className="w-6 h-6 text-blue-600" /> Basic Information</>}
              {currentStep === 2 && <><MapPin className="w-6 h-6 text-blue-600" /> Address Details</>}
              {currentStep === 3 && <><User className="w-6 h-6 text-blue-600" /> Contact Person</>}
              {currentStep === 4 && <><Mail className="w-6 h-6 text-blue-600" /> NGO Contact & Login</>}
              {currentStep === 5 && <><FileText className="w-6 h-6 text-blue-600" /> Document Upload</>}
              {currentStep === 6 && <><CheckCircle className="w-6 h-6 text-blue-600" /> Review & Submit</>}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Enter your NGO's basic information"}
              {currentStep === 2 && "Provide your operational address"}
              {currentStep === 3 && "Authorized person details"}
              {currentStep === 4 && "NGO contact details and login credentials"}
              {currentStep === 5 && "Upload required documents (all mandatory)"}
              {currentStep === 6 && "Review your information and submit"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NGO Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter your NGO name"
                    value={formData.ngoName}
                    onChange={(e) => handleInputChange('ngoName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter registration number"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.registrationType}
                    onChange={(e) => handleInputChange('registrationType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select registration type</option>
                    <option value="trust">Trust Registration Certificate</option>
                    <option value="society">Society Registration Certificate</option>
                    <option value="section8">Section 8 Company Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Establishment <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter year of establishment"
                    value={formData.yearOfEstablishment}
                    onChange={(e) => handleInputChange('yearOfEstablishment', e.target.value)}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Address Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Enter 6-digit pincode"
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      maxLength={6}
                    />
                    {pincodeLoading && (
                      <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-blue-600" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="City (auto-filled)"
                      value={formData.city}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="State (auto-filled)"
                      value={formData.state}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Enter complete address"
                    value={formData.fullAddress}
                    onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Contact Person */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter authorized person name"
                    value={formData.contactPersonName}
                    onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation/Role <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Manager, Secretary, Trustee"
                    value={formData.contactPersonRole}
                    onChange={(e) => handleInputChange('contactPersonRole', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter 10-digit mobile number"
                    value={formData.contactPersonMobile}
                    onChange={(e) => handleInputChange('contactPersonMobile', e.target.value)}
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={formData.contactPersonEmail}
                    onChange={(e) => handleInputChange('contactPersonEmail', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 4: NGO Contact & Login */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NGO Official Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter NGO official email"
                    value={formData.ngoEmail}
                    onChange={(e) => handleInputChange('ngoEmail', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be used for login</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NGO Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter NGO phone number"
                    value={formData.ngoPhone}
                    onChange={(e) => handleInputChange('ngoPhone', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  />
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Optional Fields */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Optional Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website URL
                      </label>
                      <Input
                        placeholder="https://your-ngo-website.com"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facebook Page
                      </label>
                      <Input
                        placeholder="https://facebook.com/your-ngo"
                        value={formData.facebookPage}
                        onChange={(e) => handleInputChange('facebookPage', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instagram Page
                      </label>
                      <Input
                        placeholder="https://instagram.com/your-ngo"
                        value={formData.instagramPage}
                        onChange={(e) => handleInputChange('instagramPage', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Maps Link
                      </label>
                      <Input
                        placeholder="Google Maps location link"
                        value={formData.googleMapsLink}
                        onChange={(e) => handleInputChange('googleMapsLink', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Document Upload */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">Document Requirements</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• All documents are mandatory</li>
                    <li>• Accepted formats: PDF, JPG, PNG</li>
                    <li>• Maximum file size: 5MB (auto-compressed)</li>
                    <li>• Ensure documents are clear and readable</li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <FileUploadField
                    field="registrationCertificate"
                    label="NGO Registration Certificate"
                    required
                    description="Trust/Society/Section 8 Company Certificate"
                  />

                  <FileUploadField
                    field="bloodBankLicense"
                    label="Blood Bank/Donation License"
                    required
                    description="License from State Drug Control Department or CDSCO"
                  />

                  <FileUploadField
                    field="panCard"
                    label="PAN Card of NGO"
                    required
                    description="PAN in NGO's name (not personal PAN)"
                  />

                  <FileUploadField
                    field="addressProof"
                    label="Address Proof"
                    required
                    description="Electricity bill, Water bill, Rent agreement, or Property tax receipt"
                  />

                  <FileUploadField
                    field="idProof"
                    label="ID Proof of Authorized Person"
                    required
                    description="Aadhaar Card, Voter ID, or Passport of contact person"
                  />

                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 mb-4">Optional Documents</h3>
                    
                    <div className="space-y-6">
                      <FileUploadField
                        field="certificate80G"
                        label="80G Certificate"
                        description="For NGOs accepting donations (if available)"
                      />

                      <FileUploadField
                        field="certificate12A"
                        label="12A Certificate"
                        description="For NGOs accepting donations (if available)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Review & Submit */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Legal Confirmation Required</h3>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.legalConfirmation}
                      onChange={(e) => handleInputChange('legalConfirmation', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded mt-1"
                    />
                    <span className="text-sm text-yellow-700">
                      I confirm that all uploaded documents are genuine and accurate. I understand that Samarpan is not responsible for any misuse of information provided. Any false information may result in rejection of the application.
                    </span>
                  </label>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Application Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">NGO Name:</span> {formData.ngoName}
                    </div>
                    <div>
                      <span className="font-medium">Registration Type:</span> {formData.registrationType}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {formData.city}, {formData.state}
                    </div>
                    <div>
                      <span className="font-medium">Contact Person:</span> {formData.contactPersonName}
                    </div>
                    <div>
                      <span className="font-medium">NGO Email:</span> {formData.ngoEmail}
                    </div>
                    <div>
                      <span className="font-medium">Documents Uploaded:</span> {Object.values(uploadedFiles).filter(file => file !== null).length}/7
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Your application will be reviewed by our admin team</li>
                    <li>We will verify all submitted documents</li>
                    <li>You will receive an email notification about the status</li>
                    <li>Once approved, you can login using your NGO email and password</li>
                    <li>Start managing blood donation activities through Samarpan</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < 6 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!validateStep(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateStep(6) || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}