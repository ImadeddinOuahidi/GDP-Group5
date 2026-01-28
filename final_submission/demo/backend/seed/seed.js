const mongoose = require('mongoose');
const { users, medicines, reports, symptomProgressions } = require('./data');
const User = require('../models/User');
const Medication = require('../models/Medication');
const ReportSideEffect = require('../models/ReportSideEffect');
const SymptomProgression = require('../models/SymptomProgression');

// MongoDB Connection URI - use the same logic as in your app.js
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_app';

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to MongoDB for seeding.');

    // 2. Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Medication.deleteMany({});
    await ReportSideEffect.deleteMany({});
    await SymptomProgression.deleteMany({});
    console.log('Existing data cleared.');

    // 3. Insert new data
    console.log('Inserting new seed data...');
    await User.insertMany(users);
    console.log(`${users.length} users inserted.`);

    await Medication.insertMany(medicines);
    console.log(`${medicines.length} medications inserted.`);

    await ReportSideEffect.insertMany(reports);
    console.log(`${reports.length} side effect reports inserted.`);

    await SymptomProgression.insertMany(symptomProgressions);
    console.log(`${symptomProgressions.length} symptom progressions inserted.`);

    console.log('\n✅ Database has been successfully seeded!');

  } catch (error) {
    console.error('❌ Error seeding the database:', error);
  } finally {
    // 4. Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

// Run the seeding function
seedDatabase();
