/**
 * Seed Demo Users
 * Creates consistent demo users for testing and demonstration
 * 
 * Demo Credentials:
 * - Patient: patient@demo.com / Demo@123
 * - Doctor: doctor@demo.com / Demo@123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get MongoDB URI from config (same as main app)
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_app';

// Define User schema directly to avoid model conflicts
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  phone: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  patientInfo: {
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    bloodGroup: String,
    allergies: [String],
    chronicConditions: [String]
  },
  doctorInfo: {
    licenseNumber: String,
    specialization: String,
    yearsOfExperience: Number,
    consultationFee: Number,
    biography: String
  },
  isEmailVerified: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('DemoUser', userSchema, 'users');

// Demo users to create
const demoUsers = [
  {
    firstName: 'Demo',
    lastName: 'Patient',
    email: 'patient@demo.com',
    password: 'Demo@123',
    phone: '555-PATIENT',
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
        phone: '555-EMERGENCY'
      },
      bloodGroup: 'O+',
      allergies: ['None'],
      chronicConditions: []
    },
    isEmailVerified: true,
    isActive: true
  },
  {
    firstName: 'Dr. Demo',
    lastName: 'Doctor',
    email: 'doctor@demo.com',
    password: 'Demo@123',
    phone: '555-DOCTOR',
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

async function seedDemoUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Seeding Demo Users ===\n');

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        // Update existing user with new password
        console.log(`Updating existing user: ${userData.email}`);
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await User.updateOne(
          { email: userData.email },
          { 
            ...userData,
            password: hashedPassword,
            updatedAt: new Date()
          }
        );
        console.log(`  ✅ Updated: ${userData.email} (${userData.role})`);
      } else {
        // Create new user
        console.log(`Creating new user: ${userData.email}`);
        const newUser = new User(userData);
        await newUser.save();
        console.log(`  ✅ Created: ${userData.email} (${userData.role})`);
      }
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

// Run the seed function
seedDemoUsers();
