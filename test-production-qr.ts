import { generateAdminToken } from './lib/auth';

const API_BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  rateLimitWindow: 60000, // 1 minute
  maxRequestsPerWindow: 10
};

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

class ProductionQRTester {
  private adminToken: string;
  private testResults: TestResult[] = [];
  private requestCount = 0;
  private requestTimestamps: number[] = [];

  constructor() {
    // Generate a test admin token
    this.adminToken = generateAdminToken('test-admin-123', 'admin', 'admin@example.com');
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Authorization': `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;
  }

  private logTest(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
    this.testResults.push({ test, status, message, details });
    console.log(`[${status}] ${test}: ${message}`);
    if (details) {
      console.log('Details:', JSON.stringify(details, null, 2));
    }
  }

  async testSecurityHeaders() {
    console.log('\n🛡️  Testing Security Headers...');
    
    try {
      const response = await this.makeRequest(`${API_BASE_URL}/api/event-registrations/qr-verify?qrToken=test`);
      
      const headers = {
        'x-frame-options': response.headers.get('x-frame-options'),
        'x-content-type-options': response.headers.get('x-content-type-options'),
        'referrer-policy': response.headers.get('referrer-policy'),
        'x-xss-protection': response.headers.get('x-xss-protection'),
        'strict-transport-security': response.headers.get('strict-transport-security'),
        'content-security-policy': response.headers.get('content-security-policy'),
        'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
        'x-ratelimit-window': response.headers.get('x-ratelimit-window')
      };

      // Check security headers
      if (headers['x-frame-options'] === 'DENY') {
        this.logTest('X-Frame-Options', 'PASS', 'Header present and set to DENY');
      } else {
        this.logTest('X-Frame-Options', 'FAIL', `Expected DENY, got ${headers['x-frame-options']}`);
      }

      if (headers['x-content-type-options'] === 'nosniff') {
        this.logTest('X-Content-Type-Options', 'PASS', 'Header present and set to nosniff');
      } else {
        this.logTest('X-Content-Type-Options', 'FAIL', `Expected nosniff, got ${headers['x-content-type-options']}`);
      }

      if (headers['x-ratelimit-limit'] === '10') {
        this.logTest('Rate Limit Headers', 'PASS', 'Rate limit headers present');
      } else {
        this.logTest('Rate Limit Headers', 'FAIL', `Expected 10, got ${headers['x-ratelimit-limit']}`);
      }

    } catch (error) {
      this.logTest('Security Headers', 'FAIL', `Error testing headers: ${error}`);
    }
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    // Test without token
    try {
      const response = await fetch(`${API_BASE_URL}/api/event-registrations/qr-verify?qrToken=test`);
      const data = await response.json();
      
      if (response.status === 401 && data.error === 'Unauthorized') {
        this.logTest('Missing Token', 'PASS', 'Correctly rejects requests without token');
      } else {
        this.logTest('Missing Token', 'FAIL', `Expected 401, got ${response.status}`);
      }
    } catch (error) {
      this.logTest('Missing Token', 'FAIL', `Error: ${error}`);
    }

    // Test with invalid token
    try {
      const response = await fetch(`${API_BASE_URL}/api/event-registrations/qr-verify?qrToken=test`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      const data = await response.json();
      
      if (response.status === 403 && data.error === 'Admin access required') {
        this.logTest('Invalid Token', 'PASS', 'Correctly rejects invalid tokens');
      } else {
        this.logTest('Invalid Token', 'FAIL', `Expected 403, got ${response.status}`);
      }
    } catch (error) {
      this.logTest('Invalid Token', 'FAIL', `Error: ${error}`);
    }
  }

  async testInputValidation() {
    console.log('\n📝 Testing Input Validation...');
    
    // Test with invalid QR token format
    try {
      const response = await this.makeRequest(
        `${API_BASE_URL}/api/event-registrations/qr-verify?qrToken=<script>alert('xss')</script>`
      );
      const data = await response.json();
      
      if (response.status === 400 && data.error === 'Invalid QR token format') {
        this.logTest('XSS Prevention', 'PASS', 'Correctly sanitizes malicious input');
      } else {
        this.logTest('XSS Prevention', 'FAIL', `Expected 400 with validation error, got ${response.status}`);
      }
    } catch (error) {
      this.logTest('XSS Prevention', 'FAIL', `Error: ${error}`);
    }

    // Test with missing QR token
    try {
      const response = await this.makeRequest(
        `${API_BASE_URL}/api/event-registrations/qr-verify`
      );
      const data = await response.json();
      
      if (response.status === 400 && data.error === 'QR token is required') {
        this.logTest('Missing QR Token', 'PASS', 'Correctly validates required fields');
      } else {
        this.logTest('Missing QR Token', 'FAIL', `Expected 400, got ${response.status}`);
      }
    } catch (error) {
      this.logTest('Missing QR Token', 'FAIL', `Error: ${error}`);
    }
  }

  async testRateLimiting() {
    console.log('\n⏱️  Testing Rate Limiting...');
    
    // Make multiple rapid requests to test rate limiting (reduced from 35 to 20)
    const requests = [];
    for (let i = 0; i < 20; i++) {
      requests.push(
        this.makeRequest(`${API_BASE_URL}/api/event-registrations/qr-verify?qrToken=test-${i}`)
          .then(response => ({ status: response.status, data: null }))
          .catch(error => ({ status: 0, data: null, error: error.message }))
      );
    }

    const results = await Promise.all(requests);
    const rateLimitedRequests = results.filter(r => r.status === 429).length;
    
    if (rateLimitedRequests > 0) {
      this.logTest('Rate Limiting', 'PASS', `Rate limiting working: ${rateLimitedRequests} requests blocked`);
    } else {
      this.logTest('Rate Limiting', 'FAIL', 'No requests were rate limited');
    }
  }

  async testErrorHandling() {
    console.log('\n🚨 Testing Error Handling...');
    
    // Test with non-existent registration
    try {
      const response = await this.makeRequest(
        `${API_BASE_URL}/api/event-registrations/qr-verify?qrToken=EVT-NONEXISTENT-12345`
      );
      const data = await response.json();
      
      if (response.status === 404 && data.error === 'Registration not found') {
        this.logTest('Not Found Error', 'PASS', 'Correctly handles non-existent registrations');
      } else {
        this.logTest('Not Found Error', 'FAIL', `Expected 404, got ${response.status}`);
      }
    } catch (error) {
      this.logTest('Not Found Error', 'FAIL', `Error: ${error}`);
    }
  }

  async testResponseFormat() {
    console.log('\n📋 Testing Response Format...');
    
    try {
      const response = await this.makeRequest(
        `${API_BASE_URL}/api/event-registrations/qr-verify?qrToken=test`
      );
      const data = await response.json();
      
      // Check for production-ready response format
      if (data.metadata && data.metadata.requestId && data.metadata.responseTime) {
        this.logTest('Response Metadata', 'PASS', 'Response includes request metadata');
      } else {
        this.logTest('Response Metadata', 'FAIL', 'Response missing request metadata');
      }

      if (data.success !== undefined) {
        this.logTest('Response Success Flag', 'PASS', 'Response includes success flag');
      } else {
        this.logTest('Response Success Flag', 'FAIL', 'Response missing success flag');
      }
    } catch (error) {
      this.logTest('Response Format', 'FAIL', `Error: ${error}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Production QR Code System Tests...\n');
    
    await this.testSecurityHeaders();
    await this.testAuthentication();
    await this.testInputValidation();
    await this.testRateLimiting();
    
    // Add a small delay to avoid rate limiting conflicts
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.testErrorHandling();
    await this.testResponseFormat();

    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const summary = {
      total: this.testResults.length,
      passed: this.testResults.filter(r => r.status === 'PASS').length,
      failed: this.testResults.filter(r => r.status === 'FAIL').length,
      skipped: this.testResults.filter(r => r.status === 'SKIP').length
    };

    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⏭️  Skipped: ${summary.skipped}`);

    if (summary.failed === 0) {
      console.log('\n🎉 All tests passed! The QR verification system is production-ready.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }

    return summary;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ProductionQRTester();
  tester.runAllTests().catch(console.error);
}

export { ProductionQRTester };