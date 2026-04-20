const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
const { users, medicines, reports, symptomProgressions } = require('./data');
const User = require('../models/User');
const Medication = require('../models/Medication');
const ReportSideEffect = require('../models/ReportSideEffect');
const SymptomProgression = require('../models/SymptomProgression');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const getMongoUri = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const username = process.env.MONGO_ROOT_USER;
  const password = process.env.MONGO_ROOT_PASSWORD;
  const database = process.env.MONGO_DB_NAME || 'healthcare_app';

  if (username && password) {
    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@localhost:27017/${database}?authSource=admin`;
  }

  return 'mongodb://localhost:27017/healthcare_app';
};

const mongoURI = getMongoUri();

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

    // insertMany bypasses save() hooks, so hash passwords explicitly.
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12)
      }))
    );

    await User.insertMany(hashedUsers);
    console.log(`${users.length} users inserted.`);

    await Medication.insertMany(medicines);
    console.log(`${medicines.length} medications inserted.`);

    await ReportSideEffect.insertMany(reports);
    console.log(`${reports.length} side effect reports inserted.`);

    await SymptomProgression.insertMany(symptomProgressions);
    console.log(`${symptomProgressions.length} symptom progressions inserted.`);

    console.log('\n✅ Database has been successfully seeded!');

  } catch (error) {
    if (error?.code === 13) {
      console.error('❌ MongoDB authentication failed while seeding. Set MONGODB_URI or MONGO_ROOT_USER/MONGO_ROOT_PASSWORD in .env.');
    }
    console.error('❌ Error seeding the database:', error);
  } finally {
    // 4. Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

// Run the seeding function
seedDatabase();
