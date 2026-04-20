/**
 * Seed file for clinically realistic medications.
 *
 * Usage:
 *   node seed/seedMedications.js
 *   node seed/seedMedications.js --force
 */

const mongoose = require('mongoose');
const Medication = require('../models/Medication');
const User = require('../models/User');
const config = require('../config/config');
const medicationCatalog = require('./medicationCatalog');

async function resolveSeedOwner() {
  const admin = await User.findOne({ role: 'admin', isActive: true }).select('_id role');
  if (admin) return { id: admin._id, role: 'admin' };

  const doctor = await User.findOne({ role: 'doctor', isActive: true }).select('_id role');
  if (doctor) return { id: doctor._id, role: 'doctor' };

  return { id: new mongoose.Types.ObjectId(), role: 'admin' };
}

async function seedMedications() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Connected to MongoDB');

    const existingCount = await Medication.countDocuments({ source: 'predefined' });
    const force = process.argv.includes('--force');

    if (existingCount > 0 && !force) {
      console.log(`Database already has ${existingCount} predefined medications.`);
      console.log('Use --force to replace predefined medications with curated catalog.');
      return;
    }

    if (force) {
      console.log('Clearing existing predefined medications...');
      await Medication.deleteMany({ source: 'predefined' });
    }

    const owner = await resolveSeedOwner();

    const medicationsToInsert = medicationCatalog.map((med, index) => ({
      ...med,
      source: 'predefined',
      createdBy: owner.id,
      creatorRole: owner.role,
      isVerified: true,
      verifiedBy: owner.id,
      verifiedAt: new Date(),
      usageCount: Math.max(10, medicationCatalog.length - index) * 3,
      isActive: true
    }));

    await Medication.insertMany(medicationsToInsert, { ordered: false });

    const categories = [...new Set(medicationCatalog.map((m) => m.category))];
    console.log(`Successfully seeded ${medicationsToInsert.length} curated medications.`);
    console.log('\nMedications by category:');

    for (const category of categories) {
      const count = medicationCatalog.filter((m) => m.category === category).length;
      console.log(`  ${category}: ${count}`);
    }
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

seedMedications();
