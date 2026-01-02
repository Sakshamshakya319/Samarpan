# 📱 QR Code Module - Complete Documentation

A comprehensive QR code system with generation, scanning, and verification capabilities built for React.js + Node.js applications.

## 🎯 Overview

This QR module provides a complete end-to-end QR code solution including:
- **QR Code Generation** (Backend + Frontend)
- **Real-time Camera Scanning** (Frontend)
- **QR Code Verification** (Backend)
- **User Management Integration**
- **Audio Feedback & UX**

## 📁 Module Structure

```
QR_MODULE/
├── backend/
│   ├── routes/qr.js              # QR API endpoints
│   ├── models/
│   │   ├── User.js               # User schema with QR fields
│   │   └── QRScan.js             # Scan history schema
│   └── middleware/
│       ├── auth.js               # Authentication middleware
│       └── validation.js         # QR validation middleware
├── frontend/
│   ├── pages/
│   │   ├── QRScanner.jsx         # Main QR scanner component
│   │   ├── QRTest.jsx            # QR code generator/tester
│   │   ├── Dashboard.jsx         # User QR generation
│   │   └── SimpleScannerTest.jsx # Simple scanner implementation
│   ├── components/
│   │   └── SimpleQRScanner.jsx   # Reusable scanner component
│   ├── utils/
│   │   └── beepSound.js          # Audio feedback utility
│   └── config/
│       └── api.js                # API configuration
└── docs/
    ├── QR_MODULE_README.md       # This file
    ├── API_ENDPOINTS.md          # API documentation
    └── INTEGRATION_GUIDE.md      # Integration instructions
```

## 🔧 Dependencies

### Backend Dependencies
```json
{
  "qrcode": "^1.5.3",           // QR code generation
  "mongoose": "^8.0.3",         // Database ODM
  "express": "^4.18.2",         // Web framework
  "jsonwebtoken": "^9.0.2",     // Authentication
  "bcryptjs": "^2.4.3"          // Password hashing
}
```

### Frontend Dependencies
```json
{
  "html5-qrcode": "^2.3.8",     // QR scanning library
  "react": "^18.2.0",           // UI framework
  "axios": "^1.6.2",            // HTTP client
  "react-hot-toast": "^2.4.1",  // Notifications
  "lucide-react": "^0.294.0"    // Icons
}
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install qrcode mongoose express jsonwebtoken bcryptjs

# Frontend  
cd frontend
npm install html5-qrcode react axios react-hot-toast lucide-react
```

### 2. Setup Database Models
```javascript
// backend/models/User.js
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  qrCode: String,        // Base64 QR image
  qrCodeData: String,    // JSON QR data
  qrGeneratedAt: Date,   // Generation timestamp
  eventId: String,       // Event association
  isApproved: Boolean    // Approval status
});

// backend/models/QRScan.js  
const qrScanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  qrData: String,        // Scanned QR data
  scanType: String,      // 'approval', 'entry', 'verification'
  scanResult: String,    // 'success', 'failed', 'duplicate'
  notes: String,         // Additional notes
  createdAt: { type: Date, default: Date.now }
});
```

### 3. Setup API Routes
```javascript
// backend/routes/qr.js
const express = require('express');
const QRCode = require('qrcode');
const router = express.Router();

// Generate QR for user
router.post('/generate-my-qr', auth, async (req, res) => {
  // Implementation in full code below
});

// Scan QR code
router.post('/scan', adminAuth, async (req, res) => {
  // Implementation in full code below
});
```

### 4. Setup Frontend Scanner
```jsx
// frontend/components/QRScanner.jsx
import { Html5Qrcode } from 'html5-qrcode';
import { playBeep } from '../utils/beepSound';

const QRScanner = ({ onScanSuccess }) => {
  // Implementation in full code below
};
```

## 📡 API Endpoints

### QR Generation Endpoints

#### `POST /api/qr/generate-my-qr` (User)
Generate QR code for current user
```javascript
// Request
{
  "eventId": "event-123"
}

// Response
{
  "message": "QR code generated successfully",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "qrData": "{\"userId\":\"...\",\"email\":\"...\"}",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "isApproved": true
  }
}
```

#### `POST /api/qr/generate/:userId` (Admin)
Generate QR code for specific user
```javascript
// Request
{
  "eventId": "event-123"
}

// Response - Same as above
```

### QR Scanning Endpoints

#### `POST /api/qr/scan` (Admin)
Scan and process QR code
```javascript
// Request
{
  "qrData": "{\"userId\":\"...\",\"email\":\"...\"}",
  "scanType": "approval",
  "notes": "Scanned at entrance"
}

// Response
{
  "message": "User approved successfully",
  "scanResult": "success",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "isApproved": true,
    "approvedDate": "2024-01-02T10:30:00.000Z"
  },
  "scan": {
    "scanType": "approval",
    "scanResult": "success",
    "createdAt": "2024-01-02T10:30:00.000Z"
  }
}
```

#### `GET /api/qr/my-qr` (User)
Get current user's QR code
```javascript
// Response
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "isApproved": true
}
```

## 🔍 QR Data Format

### Standard QR Data Structure
```javascript
{
  "userId": "64c91d8f2e1b4c001f123456",
  "email": "user@example.com",
  "name": "John Doe",
  "eventId": "event-2024-001",
  "generatedAt": "2024-01-02T10:30:00.000Z",
  "generatedBy": "64c91d8f2e1b4c001f789012",
  "type": "user-generated"  // or "admin-generated"
}
```

### QR Code Generation Options
```javascript
const qrOptions = {
  errorCorrectionLevel: 'M',  // L, M, Q, H
  type: 'image/png',
  quality: 0.92,
  margin: 1,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  width: 256
};
```

## 📱 Frontend Components

### 1. Main QR Scanner Component

```jsx
// frontend/pages/QRScanner.jsx
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { playBeep } from '../utils/beepSound';
import api from '../config/api';
import toast from 'react-hot-toast';

const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('unknown');
  
  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false); // Prevent duplicate scans

  useEffect(() => {
    checkCameraPermission();
    
    // Create Html5Qrcode instance ONCE
    const initializeScanner = () => {
      const element = document.getElementById('qr-reader');
      if (element) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      } else {
        setTimeout(initializeScanner, 100);
      }
    };
    
    initializeScanner();
    
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraPermission('not-supported');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
    } catch (error) {
      setCameraPermission(error.name === 'NotAllowedError' ? 'denied' : 'error');
    }
  };

  const startScanner = async () => {
    try {
      if (!html5QrCodeRef.current) {
        throw new Error('Scanner not initialized');
      }

      isScanningRef.current = false;
      setIsScanning(true);

      const onScanSuccess = async (decodedText) => {
        // 🔒 Prevent duplicate scans
        if (isScanningRef.current) return;
        isScanningRef.current = true;

        try {
          // 🔊 Play beep sound
          playBeep();
          
          // 🛑 Stop scanner immediately
          await html5QrCodeRef.current.stop();
          setIsScanning(false);
          
          // Process QR code
          await processQRCode(decodedText);
          
          toast.success('QR Code scanned successfully!');
        } catch (error) {
          console.error('Error processing QR code:', error);
          toast.error('Failed to process QR code');
          isScanningRef.current = false;
        }
      };

      const onScanFailure = (error) => {
        console.debug('QR scan attempt:', error);
      };

      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, // Back camera
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanFailure
      );

    } catch (error) {
      console.error('Scanner start error:', error);
      setIsScanning(false);
      isScanningRef.current = false;
      toast.error('Failed to start camera scanner');
    }
  };

  const processQRCode = async (qrData) => {
    try {
      const response = await api.post('/qr/scan', {
        qrData: qrData.trim(),
        scanType: 'approval',
        notes: 'Scanned via QR Scanner'
      });

      setScanResult(response.data);
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to process QR code';
      setScanResult({
        scanResult: 'failed',
        message,
        user: null
      });
    }
  };

  return (
    <div className="qr-scanner">
      {/* Scanner Controls */}
      {cameraPermission === 'granted' && (
        <div className="scanner-controls">
          {!isScanning ? (
            <button onClick={startScanner} className="btn btn-primary">
              Start Camera Scanner
            </button>
          ) : (
            <button onClick={() => setIsScanning(false)} className="btn btn-danger">
              Stop Scanner
            </button>
          )}
        </div>
      )}

      {/* QR Reader Container - ALWAYS rendered */}
      <div 
        id="qr-reader" 
        style={{ 
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto',
          minHeight: '300px',
          display: isScanning ? 'block' : 'none'
        }}
      />

      {/* Scan Result Display */}
      {scanResult && (
        <div className="scan-result">
          <h3>Scan Result</h3>
          <p className={scanResult.scanResult === 'success' ? 'text-success' : 'text-danger'}>
            {scanResult.message}
          </p>
          
          {scanResult.user && (
            <div className="user-info">
              <p><strong>Name:</strong> {scanResult.user.name}</p>
              <p><strong>Email:</strong> {scanResult.user.email}</p>
              <p><strong>Status:</strong> {scanResult.user.isApproved ? 'Approved' : 'Pending'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRScanner;
```

### 2. Simple Reusable Scanner Component

```jsx
// frontend/components/SimpleQRScanner.jsx
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef } from "react";
import { playBeep } from "../utils/beepSound";

const SimpleQRScanner = ({ onScanSuccess, onError }) => {
  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("simple-qr-reader");

    const startScanner = async () => {
      try {
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (isScanningRef.current) return;
            isScanningRef.current = true;

            playBeep();
            await html5QrCodeRef.current.stop();
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            console.debug("Scan attempt:", errorMessage);
          }
        );
      } catch (err) {
        if (onError) onError(err);
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
        }).catch(console.error);
      }
    };
  }, [onScanSuccess, onError]);

  return (
    <div>
      <div id="simple-qr-reader" style={{ width: "300px", margin: "0 auto" }} />
    </div>
  );
};

export default SimpleQRScanner;
```

### 3. QR Generation Component

```jsx
// frontend/pages/Dashboard.jsx (QR Generation Section)
const generateMyQR = async () => {
  try {
    setGeneratingQR(true);
    const response = await api.post('/qr/generate-my-qr', {
      eventId: 'user-dashboard-generated'
    });
    
    setQrCode(response.data.qrCode);
    toast.success('QR code generated successfully!');
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to generate QR code';
    toast.error(message);
  } finally {
    setGeneratingQR(false);
  }
};

const downloadQR = () => {
  if (!qrCode) return;
  
  const link = document.createElement('a');
  link.href = qrCode;
  link.download = `${user?.name || 'user'}-qr-code.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('QR code downloaded!');
};
```

## 🔊 Audio Feedback System

```javascript
// frontend/utils/beepSound.js
export const playBeep = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.log('Beep sound not supported:', error);
  }
};
```

## 🎨 CSS Styling

```css
/* QR Code Display Styles */
.qr-code-display {
  text-align: center;
}

.qr-code-display img {
  max-width: 100%;
  height: auto;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.qr-code-display img:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* QR Scanner Styles */
.qr-scanner {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.scanner-controls {
  text-align: center;
  margin-bottom: 20px;
}

.scan-result {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

/* Responsive Design */
@media (max-width: 768px) {
  .qr-code-display img {
    max-width: 280px;
    padding: 12px;
  }
  
  .qr-scanner {
    padding: 10px;
  }
}
```

## 🔒 Security Considerations

### QR Data Validation
```javascript
// backend/middleware/validation.js
const { body, validationResult } = require('express-validator');

const qrScanValidation = [
  body('qrData')
    .notEmpty()
    .withMessage('QR data is required')
    .isLength({ max: 2000 })
    .withMessage('QR data too long')
    .custom((value) => {
      try {
        const parsed = JSON.parse(value);
        if (!parsed.userId || !parsed.email) {
          throw new Error('Invalid QR data format');
        }
        return true;
      } catch (error) {
        throw new Error('Invalid JSON in QR data');
      }
    }),
  
  body('scanType')
    .isIn(['approval', 'entry', 'verification'])
    .withMessage('Invalid scan type'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    next();
  }
];
```

### Authentication Middleware
```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminAuth = async (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin required.' });
    }
    next();
  });
};
```

## 🧪 Testing

### QR Generation Test
```javascript
// Test QR generation
const testQRGeneration = async () => {
  const response = await fetch('/api/qr/generate-my-qr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ eventId: 'test-event' })
  });
  
  const data = await response.json();
  console.log('QR Generated:', data.qrCode ? 'Success' : 'Failed');
};
```

### QR Scanning Test
```javascript
// Test QR scanning
const testQRScanning = async (qrData) => {
  const response = await fetch('/api/qr/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      qrData: qrData,
      scanType: 'approval',
      notes: 'Test scan'
    })
  });
  
  const result = await response.json();
  console.log('Scan Result:', result.scanResult);
};
```

## 🚀 Integration Guide

### 1. Copy Required Files
```bash
# Backend files
cp backend/routes/qr.js your-project/backend/routes/
cp backend/models/QRScan.js your-project/backend/models/
cp backend/middleware/validation.js your-project/backend/middleware/

# Frontend files
cp frontend/pages/QRScanner.jsx your-project/frontend/src/pages/
cp frontend/components/SimpleQRScanner.jsx your-project/frontend/src/components/
cp frontend/utils/beepSound.js your-project/frontend/src/utils/
```

### 2. Install Dependencies
```bash
# Backend
npm install qrcode

# Frontend
npm install html5-qrcode
```

### 3. Update Database Schema
```javascript
// Add QR fields to your User model
const userSchema = new mongoose.Schema({
  // ... existing fields
  qrCode: String,
  qrCodeData: String,
  qrGeneratedAt: Date,
  eventId: String
});
```

### 4. Add Routes
```javascript
// backend/server.js
const qrRoutes = require('./routes/qr');
app.use('/api/qr', qrRoutes);
```

### 5. Add Frontend Routes
```jsx
// frontend/App.jsx
import QRScanner from './pages/QRScanner';

<Route path="/scanner" element={<QRScanner />} />
```

## 📋 Troubleshooting

### Common Issues

#### Camera Not Working
- Ensure HTTPS connection (required for camera access)
- Check camera permissions in browser
- Verify no other apps are using the camera

#### QR Code Not Scanning
- Ensure good lighting conditions
- Hold QR code steady at proper distance
- Verify QR code contains valid JSON data

#### Duplicate Scans
- Check `isScanningRef.current` lock is working
- Verify scanner stops after successful scan
- Ensure proper cleanup in useEffect

### Debug Information
```javascript
// Add debug logging
console.log('Camera Permission:', cameraPermission);
console.log('Scanner Active:', isScanning);
console.log('Scan Lock:', isScanningRef.current);
console.log('QR Reader Element:', document.getElementById('qr-reader'));
```

## 🎯 Best Practices

1. **Always render QR reader div** - Never conditionally mount/unmount
2. **Use scan locks** - Prevent duplicate processing
3. **Stop scanner after success** - Clean UX flow
4. **Provide audio feedback** - User confirmation
5. **Validate QR data** - Security and data integrity
6. **Handle errors gracefully** - Fallback options
7. **Test on multiple devices** - Cross-browser compatibility

## 📄 License

This QR module is designed to be reusable across projects. Modify and adapt as needed for your specific requirements.

---

**Built for seamless QR code generation and scanning in modern web applications** 🚀