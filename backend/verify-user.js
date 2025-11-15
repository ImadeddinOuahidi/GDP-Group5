const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function verifyUser() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/safemed_adr');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'patient1@example.com' }).select('+password');
    
    if (user) {
      console.log('Found user:', {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password,
        passwordHash: user.password?.substring(0, 20) + '...'
      });

      // Test password verification
      const testPasswords = ['1234', 'password123', 'password'];
      for (const pwd of testPasswords) {
        const isMatch = await user.correctPassword(pwd, user.password);
        console.log(`Password '${pwd}': ${isMatch ? 'MATCH' : 'NO MATCH'}`);
      }
    } else {
      console.log('User not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyUser();