// MongoDB Initialization Script
// This script runs when the MongoDB container first starts

// Switch to the application database
db = db.getSiblingDB('adr_system');

// Create application user
db.createUser({
  user: 'adr_app',
  pwd: 'adr_app_password',
  roles: [
    { role: 'readWrite', db: 'adr_system' }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

db.medications.createIndex({ name: 'text', genericName: 'text' });
db.medications.createIndex({ category: 1 });
db.medications.createIndex({ isVerified: 1 });
db.medications.createIndex({ source: 1 });

db.reportsideeffects.createIndex({ reportedBy: 1 });
db.reportsideeffects.createIndex({ medicine: 1 });
db.reportsideeffects.createIndex({ status: 1 });
db.reportsideeffects.createIndex({ 'reportDetails.reportDate': -1 });
db.reportsideeffects.createIndex({ 'metadata.aiProcessed': 1 });

print('MongoDB initialized successfully');
