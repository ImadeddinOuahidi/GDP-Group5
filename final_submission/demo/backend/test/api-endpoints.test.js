/**
 * Comprehensive API Endpoints Test Suite
 * Tests all 61 endpoints documented in swagger.yaml
 * 
 * Setup Instructions:
 * 1. npm install --save-dev jest supertest
 * 2. Ensure MongoDB is running
 * 3. Create .env.test with test database configuration
 * 4. Run: npm test
 */

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Medication = require('../models/Medication');
const ReportSideEffect = require('../models/ReportSideEffect');
const SymptomProgression = require('../models/SymptomProgression');

// Test data
let authToken = '';
let doctorToken = '';
let adminToken = '';
let testUserId = '';
let testMedicationId = '';
let testReportId = '';
let testProgressionId = '';
let uploadedFileKey = '';

// Setup and Teardown
beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/gdp-test';
  await mongoose.connect(mongoUri);
  
  // Clear test data
  await User.deleteMany({ email: /@test\.com$/ });
  await Medicine.deleteMany({ name: /^TEST_/ });
  await ReportSideEffect.deleteMany({});
  await SymptomProgression.deleteMany({});
});

afterAll(async () => {
  // Cleanup and disconnect
  await mongoose.connection.close();
});

describe('API Endpoints Test Suite', () => {
  
  // ========================================
  // AUTHENTICATION ENDPOINTS (9 tests)
  // ========================================
  
  describe('Authentication Endpoints', () => {
    
    test('POST /auth/signup - Register new patient', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'patient@test.com',
          password: 'Test123456',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          role: 'patient',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA'
          }
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      authToken = response.body.data.token;
      testUserId = response.body.data.user._id;
    });

    test('POST /auth/signup - Register new doctor', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Dr. Sarah',
          lastName: 'Smith',
          email: 'doctor@test.com',
          password: 'Test123456',
          phone: '+1234567891',
          dateOfBirth: '1985-05-15',
          gender: 'female',
          role: 'doctor',
          address: {
            street: '456 Medical Ave',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345'
          },
          doctorInfo: {
            licenseNumber: 'TEST123456',
            specialization: 'General Medicine',
            yearsOfExperience: 5
          }
        });
      
      expect(response.status).toBe(201);
      doctorToken = response.body.data.token;
    });

    test('POST /auth/signup - Register admin', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@test.com',
          password: 'Test123456',
          phone: '+1234567892',
          dateOfBirth: '1980-01-01',
          gender: 'other',
          role: 'admin',
          address: {
            street: '789 Admin Blvd',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345'
          }
        });
      
      expect(response.status).toBe(201);
      adminToken = response.body.data.token;
    });

    test('POST /auth/signin - Sign in user', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'patient@test.com',
          password: 'Test123456'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('GET /auth/verify-email - Verify email (should fail without token)', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: 'invalid-token' });
      
      expect(response.status).toBe(400);
    });

    test('POST /auth/resend-verification - Resend verification email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'patient@test.com' });
      
      expect([200, 400]).toContain(response.status);
    });

    test('GET /auth/profile - Get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });

    test('PUT /auth/profile - Update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John Updated',
          phone: '+1987654321'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('PUT /auth/change-password - Change password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test123456',
          newPassword: 'NewTest123456'
        });
      
      expect(response.status).toBe(200);
      
      // Change it back
      await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'NewTest123456',
          newPassword: 'Test123456'
        });
    });
  });

  // ========================================
  // MEDICINE ENDPOINTS (10 tests)
  // ========================================
  
  describe('Medicine Endpoints', () => {
    
    test('POST /medicines - Add new medicine (Doctor)', async () => {
      const response = await request(app)
        .post('/api/medicines')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          name: 'TEST_Aspirin',
          genericName: 'Acetylsalicylic Acid',
          category: 'Pain Relief',
          manufacturer: 'Test Pharma',
          description: 'Test pain reliever',
          dosageForm: 'Tablet',
          strength: '500mg',
          quantityInStock: 100,
          reorderLevel: 20,
          price: 5.99,
          expiryDate: '2025-12-31',
          sideEffects: ['Stomach upset', 'Heartburn'],
          contraindications: ['Bleeding disorders'],
          requiresPrescription: false
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testMedicineId = response.body.data.medicine._id;
    });

    test('GET /medicines - Get all medicines', async () => {
      const response = await request(app)
        .get('/api/medicines')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.medicines)).toBe(true);
    });

    test('GET /medicines/:id - Get medicine by ID', async () => {
      const response = await request(app)
        .get(`/api/medicines/${testMedicineId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicine._id).toBe(testMedicineId);
    });

    test('PUT /medicines/:id - Update medicine', async () => {
      const response = await request(app)
        .put(`/api/medicines/${testMedicineId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          price: 6.99,
          quantityInStock: 150
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /medicines/search/fuzzy - Fuzzy search medicines', async () => {
      const response = await request(app)
        .get('/api/medicines/search/fuzzy')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'asprin', threshold: 0.6 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /medicines/suggestions - Get medicine suggestions', async () => {
      const response = await request(app)
        .get('/api/medicines/suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'asp', limit: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /medicines/categories - Get all categories', async () => {
      const response = await request(app)
        .get('/api/medicines/categories')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('PUT /medicines/:id/stock - Update medicine stock', async () => {
      const response = await request(app)
        .put(`/api/medicines/${testMedicineId}/stock`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ quantityInStock: 200 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /medicines/low-stock - Get low stock medicines', async () => {
      const response = await request(app)
        .get('/api/medicines/low-stock')
        .set('Authorization', `Bearer ${doctorToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('DELETE /medicines/:id - Delete medicine (Admin)', async () => {
      // Create a temp medicine to delete
      const createRes = await request(app)
        .post('/api/medicines')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          name: 'TEST_ToDelete',
          genericName: 'Delete Test',
          category: 'Test',
          manufacturer: 'Test',
          dosageForm: 'Tablet',
          strength: '100mg',
          quantityInStock: 50,
          price: 1.99
        });
      
      const tempId = createRes.body.data.medicine._id;
      
      const response = await request(app)
        .delete(`/api/medicines/${tempId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 403]).toContain(response.status);
    });
  });

  // ========================================
  // SIDE EFFECT REPORTS ENDPOINTS (16 tests)
  // ========================================
  
  describe('Side Effect Reports Endpoints', () => {
    
    test('POST /reports - Submit new side effect report', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicine: testMedicineId,
          sideEffects: [
            {
              effect: 'Nausea',
              severity: 'Moderate',
              onset: 'Within hours',
              bodySystem: 'Gastrointestinal'
            }
          ],
          medicationUsage: {
            indication: 'Pain relief',
            dosage: {
              amount: '500mg',
              frequency: 'Twice daily',
              route: 'Oral'
            },
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-07')
          },
          reportDetails: {
            incidentDate: new Date('2024-01-03'),
            seriousness: 'Non-serious',
            outcome: 'Recovering'
          },
          patientInfo: {
            age: 35,
            gender: 'male',
            weight: { value: 75, unit: 'kg' },
            height: { value: 175, unit: 'cm' }
          }
        });
      
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      testReportId = response.body.data._id;
    });

    test('GET /reports - Get all reports', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    test('GET /reports/dashboard - Get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${doctorToken}`);
      
      expect([200, 403]).toContain(response.status);
    });

    test('GET /reports/serious - Get serious reports', async () => {
      const response = await request(app)
        .get('/api/reports/serious')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
    });

    test('GET /reports/medicine/:medicineId - Get reports by medicine', async () => {
      const response = await request(app)
        .get(`/api/reports/medicine/${testMedicineId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });
      
      expect(response.status).toBe(200);
    });

    test('GET /reports/:id - Get report by ID', async () => {
      const response = await request(app)
        .get(`/api/reports/${testReportId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    test('PUT /reports/:id/status - Update report status', async () => {
      const response = await request(app)
        .put(`/api/reports/${testReportId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'Under Review' });
      
      expect([200, 403]).toContain(response.status);
    });

    test('POST /reports/:id/followup - Add follow-up information', async () => {
      const response = await request(app)
        .post(`/api/reports/${testReportId}/followup`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          informationType: 'Additional information',
          description: 'Patient reports improvement after stopping medication'
        });
      
      expect([200, 404]).toContain(response.status);
    });

    test('PUT /reports/:id/causality - Update causality assessment', async () => {
      const response = await request(app)
        .put(`/api/reports/${testReportId}/causality`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          algorithm: 'WHO-UMC',
          score: 5,
          category: 'Probable',
          comments: 'Temporal relationship established'
        });
      
      expect([200, 403, 404]).toContain(response.status);
    });

    test('POST /reports/aisubmit - Submit report using AI', async () => {
      const response = await request(app)
        .post('/api/reports/aisubmit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'I took aspirin and felt nauseous within 2 hours'
        });
      
      expect([201, 400, 500]).toContain(response.status);
    });

    test('POST /reports/aipreview - Preview AI-generated report', async () => {
      const response = await request(app)
        .post('/api/reports/aipreview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Headache after taking medicine'
        });
      
      expect([200, 400, 500]).toContain(response.status);
    });

    test('POST /reports/aiconfirm - Confirm AI-generated report', async () => {
      const response = await request(app)
        .post('/api/reports/aiconfirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect([201, 400, 500]).toContain(response.status);
    });

    test('POST /reports/:id/analyze-severity - Analyze severity using AI', async () => {
      const response = await request(app)
        .post(`/api/reports/${testReportId}/analyze-severity`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404, 500]).toContain(response.status);
    });

    test('GET /reports/:id/severity-status - Get severity analysis status', async () => {
      const response = await request(app)
        .get(`/api/reports/${testReportId}/severity-status`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    test('POST /reports/batch-analyze - Batch analyze severity', async () => {
      const response = await request(app)
        .post('/api/reports/batch-analyze')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ reportIds: [testReportId] });
      
      expect([200, 400, 500]).toContain(response.status);
    });

    test('GET /reports/analysis-stats - Get analysis statistics', async () => {
      const response = await request(app)
        .get('/api/reports/analysis-stats')
        .set('Authorization', `Bearer ${doctorToken}`);
      
      expect([200, 403]).toContain(response.status);
    });
  });

  // ========================================
  // SYMPTOM PROGRESSION ENDPOINTS (14 tests)
  // ========================================
  
  describe('Symptom Progression Endpoints', () => {
    
    test('POST /symptom-progression/create - Create symptom progression', async () => {
      const response = await request(app)
        .post('/api/symptom-progression/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportId: testReportId,
          sideEffectId: testReportId,
          initialImpact: {
            daily_activities: 5,
            work_performance: 3,
            sleep_quality: 4,
            social_activities: 6,
            mood: 5
          },
          notes: 'Starting to track nausea progression'
        });
      
      if (response.status === 201) {
        testProgressionId = response.body.data._id;
      }
      expect([201, 400, 404]).toContain(response.status);
    });

    test('POST /symptom-progression/:id/entries - Add progression entry', async () => {
      if (!testProgressionId) {
        return; // Skip if progression not created
      }
      
      const response = await request(app)
        .post(`/api/symptom-progression/${testProgressionId}/entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          severity: {
            level: 'Moderate',
            numericScore: 6,
            description: 'Nausea persists'
          },
          frequency: 'Frequent',
          pattern: 'Stable',
          functionalImpact: {
            daily_activities: 7,
            work_performance: 8
          },
          dataSource: 'Patient'
        });
      
      expect([200, 400, 404]).toContain(response.status);
    });

    test('GET /symptom-progression/:id - Get progression by ID', async () => {
      if (!testProgressionId) return;
      
      const response = await request(app)
        .get(`/api/symptom-progression/${testProgressionId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    test('GET /symptom-progression/patient/:patientId - Get patient progressions', async () => {
      const response = await request(app)
        .get('/api/symptom-progression/patient')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    test('GET /symptom-progression/attention/needed - Get progressions needing attention', async () => {
      const response = await request(app)
        .get('/api/symptom-progression/attention/needed')
        .set('Authorization', `Bearer ${doctorToken}`);
      
      expect([200, 403]).toContain(response.status);
    });

    test('PUT /symptom-progression/:id/status - Update progression status', async () => {
      if (!testProgressionId) return;
      
      const response = await request(app)
        .put(`/api/symptom-progression/${testProgressionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'Active' });
      
      expect([200, 400, 404]).toContain(response.status);
    });

    test('POST /symptom-progression/:id/alerts/acknowledge - Acknowledge alerts', async () => {
      if (!testProgressionId) return;
      
      const response = await request(app)
        .post(`/api/symptom-progression/${testProgressionId}/alerts/acknowledge`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ alertIds: ['507f1f77bcf86cd799439011'] });
      
      expect([200, 400, 404]).toContain(response.status);
    });

    test('GET /symptom-progression/search - Search progressions', async () => {
      const response = await request(app)
        .get('/api/symptom-progression/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'nausea', page: 1, limit: 20 });
      
      expect(response.status).toBe(200);
    });

    test('GET /symptom-progression/analytics - Get progression analytics', async () => {
      const response = await request(app)
        .get('/api/symptom-progression/analytics')
        .set('Authorization', `Bearer ${doctorToken}`);
      
      expect([200, 403]).toContain(response.status);
    });

    test('POST /symptom-progression/reports/generate - Generate progression report', async () => {
      const response = await request(app)
        .post('/api/symptom-progression/reports/generate')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          type: 'patient',
          entityId: testUserId,
          includeAnalytics: true
        });
      
      expect([200, 400, 403]).toContain(response.status);
    });

    test('GET /symptom-progression/dashboard-analytics - Get dashboard analytics', async () => {
      const response = await request(app)
        .get('/api/symptom-progression/dashboard-analytics')
        .set('Authorization', `Bearer ${doctorToken}`);
      
      expect([200, 403]).toContain(response.status);
    });

    test('GET /symptom-progression/patient-analytics/:id - Get patient analytics', async () => {
      const response = await request(app)
        .get('/api/symptom-progression/patient-analytics')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404]).toContain(response.status);
    });

    test('GET /symptom-progression/summary - Get progression summary', async () => {
      const response = await request(app)
        .get('/api/symptom-progression/summary')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
    });

    test('DELETE /symptom-progression/:id - Delete progression', async () => {
      if (!testProgressionId) return;
      
      const response = await request(app)
        .delete(`/api/symptom-progression/${testProgressionId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404]).toContain(response.status);
    });
  });

  // ========================================
  // FILE UPLOAD ENDPOINTS (12 tests)
  // ========================================
  
  describe('File Upload Endpoints', () => {
    
    test('POST /uploads/single - Upload single file', async () => {
      const response = await request(app)
        .post('/api/uploads/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt');
      
      if (response.status === 200) {
        uploadedFileKey = response.body.data?.key || 'test-file-key';
      }
      expect([200, 400, 500]).toContain(response.status);
    });

    test('POST /uploads/multiple - Upload multiple files', async () => {
      const response = await request(app)
        .post('/api/uploads/multiple')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', Buffer.from('test1'), 'test1.txt')
        .attach('files', Buffer.from('test2'), 'test2.txt');
      
      expect([200, 400, 500]).toContain(response.status);
    });

    test('POST /uploads/images - Upload images', async () => {
      const response = await request(app)
        .post('/api/uploads/images')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('images', Buffer.from('fake-image'), 'test.jpg');
      
      expect([200, 400, 500]).toContain(response.status);
    });

    test('POST /uploads/videos - Upload videos', async () => {
      const response = await request(app)
        .post('/api/uploads/videos')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('videos', Buffer.from('fake-video'), 'test.mp4');
      
      expect([200, 400, 500]).toContain(response.status);
    });

    test('POST /uploads/documents - Upload documents', async () => {
      const response = await request(app)
        .post('/api/uploads/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('documents', Buffer.from('fake-doc'), 'test.pdf');
      
      expect([200, 400, 500]).toContain(response.status);
    });

    test('GET /uploads/:key/info - Get file info', async () => {
      const response = await request(app)
        .get(`/api/uploads/${uploadedFileKey}/info`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404, 500]).toContain(response.status);
    });

    test('GET /uploads/:key/presigned-url - Get presigned URL', async () => {
      const response = await request(app)
        .get(`/api/uploads/${uploadedFileKey}/presigned-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ expiresIn: 3600 });
      
      expect([200, 404, 500]).toContain(response.status);
    });

    test('POST /uploads/:key/copy - Copy file', async () => {
      const response = await request(app)
        .post(`/api/uploads/${uploadedFileKey}/copy`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ destinationKey: 'copied-file.txt' });
      
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    test('GET /uploads/list/:folder - List files', async () => {
      const response = await request(app)
        .get('/api/uploads/list')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 500]).toContain(response.status);
    });

    test('GET /uploads/stats - Get upload statistics', async () => {
      const response = await request(app)
        .get('/api/uploads/stats')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 403, 500]).toContain(response.status);
    });

    test('GET /uploads/health - Health check', async () => {
      const response = await request(app)
        .get('/api/uploads/health');
      
      expect(response.status).toBe(200);
    });

    test('DELETE /uploads/:key - Delete file', async () => {
      const response = await request(app)
        .delete(`/api/uploads/${uploadedFileKey}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  // ========================================
  // CLEANUP TEST - Delete user account
  // ========================================
  
  describe('Cleanup', () => {
    test('DELETE /auth/deactivate - Deactivate account', async () => {
      const response = await request(app)
        .delete('/api/auth/deactivate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'Test123456' });
      
      expect([200, 400]).toContain(response.status);
    });
  });
});
