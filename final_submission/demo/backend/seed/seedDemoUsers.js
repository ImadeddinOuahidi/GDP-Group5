/**
 * Seed Demo Users
 *
 * Demo credentials:
 * - Patient: patient@demo.com / Demo@123
 * - Doctor:  doctor@demo.com / Demo@123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_app';

const demoUsers = [
  {
    firstName: 'Demo',
    lastName: 'Patient',
    email: 'patient@demo.com',
    password: 'Demo@123',
    phone: '+1-555-100-0001',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'other',
    address: {
      street: '123 Demo Street',
      city: 'Demo City',
      state: 'DC',
      zipCode: '12345',
      country: 'USA'
    },
    role: 'patient',
    patientInfo: {
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: '+1-555-100-0099'
      },
      bloodGroup: 'O+',
      allergies: ['None'],
      chronicConditions: []
    },
    isEmailVerified: true,
    isActive: true
  },
  {
    firstName: 'Demo',
    lastName: 'Doctor',
    email: 'doctor@demo.com',
    password: 'Demo@123',
    phone: '+1-555-200-0001',
    dateOfBirth: new Date('1980-05-20'),
    gender: 'other',
    address: {
      street: '456 Medical Avenue',
      city: 'Demo City',
      state: 'DC',
      zipCode: '12345',
      country: 'USA'
    },
    role: 'doctor',
    doctorInfo: {
      licenseNumber: 'DEMO123456',
      specialization: 'General Medicine',
      yearsOfExperience: 15,
      consultationFee: 100,
      biography: 'Demo doctor account for testing and demonstration purposes.'
    },
    isEmailVerified: true,
    isActive: true
  }
];

async function upsertDemoUser(userData) {
  const existing = await User.findOne({ email: userData.email }).select('+password');

  if (existing) {
    existing.firstName = userData.firstName;
    existing.lastName = userData.lastName;
    existing.email = userData.email;
    existing.password = userData.password; // pre-save hook hashes this
    existing.phone = userData.phone;
    existing.dateOfBirth = userData.dateOfBirth;
    existing.gender = userData.gender;
    existing.address = userData.address;
    existing.role = userData.role;
    existing.patientInfo = userData.patientInfo || existing.patientInfo;
    existing.doctorInfo = userData.doctorInfo || existing.doctorInfo;
    existing.isEmailVerified = true;
    existing.isActive = true;

    await existing.save();
    return 'updated';
  }

  const created = new User(userData);
  await created.save();
  return 'created';
}

async function seedDemoUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Seeding Demo Users ===\n');

    for (const userData of demoUsers) {
      const action = await upsertDemoUser(userData);
      console.log(`  ✅ ${action === 'created' ? 'Created' : 'Updated'}: ${userData.email} (${userData.role})`);
    }

    console.log('\n=== Demo Users Summary ===');
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│  Role     │  Email              │  Password         │');
    console.log('├─────────────────────────────────────────────────────┤');
    console.log('│  Patient  │  patient@demo.com   │  Demo@123         │');
    console.log('│  Doctor   │  doctor@demo.com    │  Demo@123         │');
    console.log('└─────────────────────────────────────────────────────┘');
    console.log('\nDemo users seeded successfully!');
  } catch (error) {
    console.error('Error seeding demo users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedDemoUsers();
