const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Connection
const MONGO_URI = 'mongodb://127.0.0.1:27017/safemed_adr';

// User schema (simplified for demo)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: String,
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: true },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Add password verification method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

async function createDemoUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if demo user exists
    const existingUser = await User.findOne({ email: 'patient1@example.com' });
    if (existingUser) {
      console.log('Demo user already exists:', existingUser.email);
      return;
    }

    // Create demo patient user
    const demoUser = new User({
      firstName: 'Demo',
      lastName: 'Patient',
      email: 'patient1@example.com',
      password: '1234',
      phone: '555-123-4567',
      role: 'patient',
    });

    await demoUser.save();
    console.log('Demo user created successfully:', demoUser.email);

  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createDemoUser();