const express = require('express');
const User = require('./models/User');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

app.post('/debug-signin', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    
    const { email, password } = req.body;
    console.log('Parsed email:', email);
    console.log('Parsed password:', password);
    
    // Find user
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', !!user);
    
    if (user) {
      console.log('User email in DB:', user.email);
      console.log('Email match:', user.email === email);
      
      const isPasswordCorrect = await user.correctPassword(password, user.password);
      console.log('Password correct:', isPasswordCorrect);
      
      if (isPasswordCorrect) {
        res.json({ success: true, message: 'Authentication successful' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
      }
    } else {
      res.status(401).json({ success: false, message: 'User not found' });
    }
    
  } catch (error) {
    console.error('Debug signin error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startDebugServer() {
  await mongoose.connect('mongodb://127.0.0.1:27017/safemed_adr');
  
  app.listen(3001, () => {
    console.log('Debug server running on http://localhost:3001');
    console.log('Test with: curl -X POST http://localhost:3001/debug-signin -H "Content-Type: application/json" -d \'{"email":"patient1@example.com","password":"1234"}\'');
  });
}

startDebugServer().catch(console.error);