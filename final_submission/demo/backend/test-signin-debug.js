const { body, validationResult } = require('express-validator');
const User = require('./models/User');
const mongoose = require('mongoose');

// Test the signin validation and authentication flow
async function testSignin() {
  await mongoose.connect('mongodb://127.0.0.1:27017/safemed_adr');
  console.log('Connected to MongoDB');

  // Test data
  const testData = {
    email: 'patient@demo.com',
    password: 'Demo@123'
  };

  console.log('\n=== Testing Signin Flow ===');
  console.log('Test data:', testData);

  // Create a mock request object
  const req = {
    body: testData
  };

  // Apply validation rules
  const signinValidation = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ];

  // Run validators
  for (let validator of signinValidation) {
    await validator.run(req);
  }

  // Check validation errors
  const errors = validationResult(req);
  console.log('\nValidation errors:', errors.array());

  if (!errors.isEmpty()) {
    console.log('❌ Validation failed');
    process.exit(1);
  }

  console.log('✅ Validation passed');

  // Find user
  const { email, password } = req.body;
  console.log('\nLooking for user with email:', JSON.stringify(email));

  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }

  console.log('✅ User found');
  console.log('User details:', {
    id: user._id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    hasPassword: !!user.password
  });

  // Check if user is active
  if (!user.isActive) {
    console.log('❌ User account is not active');
    process.exit(1);
  }

  console.log('✅ User account is active');

  // Test password
  console.log('\nTesting password...');
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  
  if (!isPasswordCorrect) {
    console.log('❌ Password is incorrect');
    process.exit(1);
  }

  console.log('✅ Password is correct');
  console.log('🎉 Signin flow completed successfully!');
  
  process.exit(0);
}

testSignin().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});