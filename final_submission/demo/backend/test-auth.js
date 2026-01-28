const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function testAuth() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/safemed_adr');
    console.log('Connected to MongoDB');

    // Test the full authentication flow
    const email = 'patient@demo.com';
    const password = 'Demo@123';

    console.log('\n1. Finding user with email:', email);
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user._id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password
    });

    console.log('\n2. Checking if account is active...');
    if (!user.isActive) {
      console.log('❌ Account is not active');
      return;
    }
    console.log('✅ Account is active');

    console.log('\n3. Verifying password...');
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    console.log('Password verification result:', isPasswordCorrect);
    
    if (!isPasswordCorrect) {
      console.log('❌ Password verification failed');
      // Test a few variations
      console.log('\nTesting password variations...');
      const variations = ['1234', 'password123', 'demo', 'patient1'];
      for (const pwd of variations) {
        const test = await bcrypt.compare(pwd, user.password);
        console.log(`  '${pwd}': ${test ? 'MATCH' : 'no match'}`);
      }
      return;
    }
    
    console.log('✅ Password verification successful');
    
    console.log('\n4. Authentication should succeed!');
    console.log('The issue might be in the route validation or other middleware.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAuth();