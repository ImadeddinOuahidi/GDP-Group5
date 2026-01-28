/**
 * Seed file for initial medications
 * 
 * Run this script to populate the database with common medications
 * that patients can choose from when reporting side effects.
 * 
 * Usage: node seed/seedMedications.js
 */

const mongoose = require('mongoose');
const Medication = require('../models/Medication');
const config = require('../config/config');

// Common medications data
const commonMedications = [
  // Analgesics
  {
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['500mg', '650mg', '1000mg'],
    description: 'Pain reliever and fever reducer',
    tags: ['pain', 'fever', 'headache', 'otc']
  },
  {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['200mg', '400mg', '600mg', '800mg'],
    description: 'Non-steroidal anti-inflammatory drug (NSAID)',
    tags: ['pain', 'inflammation', 'fever', 'nsaid']
  },
  {
    name: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['75mg', '81mg', '325mg', '500mg'],
    description: 'Pain reliever, fever reducer, and blood thinner',
    tags: ['pain', 'fever', 'blood thinner', 'heart']
  },
  {
    name: 'Naproxen',
    genericName: 'Naproxen Sodium',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['220mg', '250mg', '500mg'],
    description: 'NSAID for pain and inflammation',
    tags: ['pain', 'inflammation', 'arthritis', 'nsaid']
  },
  
  // Antibiotics
  {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    commonStrengths: ['250mg', '500mg', '875mg'],
    description: 'Penicillin-type antibiotic for bacterial infections',
    tags: ['antibiotic', 'infection', 'bacterial', 'penicillin']
  },
  {
    name: 'Azithromycin',
    genericName: 'Azithromycin',
    category: 'Antibiotic',
    dosageForm: 'Tablet',
    commonStrengths: ['250mg', '500mg'],
    description: 'Macrolide antibiotic for respiratory and skin infections',
    tags: ['antibiotic', 'infection', 'respiratory', 'z-pack']
  },
  {
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin HCl',
    category: 'Antibiotic',
    dosageForm: 'Tablet',
    commonStrengths: ['250mg', '500mg', '750mg'],
    description: 'Fluoroquinolone antibiotic for various infections',
    tags: ['antibiotic', 'infection', 'uti', 'respiratory']
  },
  
  // Cardiovascular
  {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
    description: 'ACE inhibitor for high blood pressure and heart failure',
    tags: ['blood pressure', 'hypertension', 'ace inhibitor', 'heart']
  },
  {
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['2.5mg', '5mg', '10mg'],
    description: 'Calcium channel blocker for blood pressure',
    tags: ['blood pressure', 'hypertension', 'calcium channel blocker']
  },
  {
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['10mg', '20mg', '40mg', '80mg'],
    description: 'Statin medication for cholesterol management',
    tags: ['cholesterol', 'statin', 'lipitor', 'heart']
  },
  {
    name: 'Metoprolol',
    genericName: 'Metoprolol Tartrate',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['25mg', '50mg', '100mg'],
    description: 'Beta blocker for blood pressure and heart conditions',
    tags: ['blood pressure', 'beta blocker', 'heart rate', 'hypertension']
  },
  
  // Diabetes
  {
    name: 'Metformin',
    genericName: 'Metformin HCl',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    commonStrengths: ['500mg', '850mg', '1000mg'],
    description: 'First-line medication for type 2 diabetes',
    tags: ['diabetes', 'blood sugar', 'type 2', 'glucose']
  },
  {
    name: 'Glipizide',
    genericName: 'Glipizide',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    commonStrengths: ['5mg', '10mg'],
    description: 'Sulfonylurea for type 2 diabetes',
    tags: ['diabetes', 'blood sugar', 'sulfonylurea']
  },
  
  // Gastrointestinal
  {
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    category: 'Gastrointestinal',
    dosageForm: 'Capsule',
    commonStrengths: ['20mg', '40mg'],
    description: 'Proton pump inhibitor for acid reflux and ulcers',
    tags: ['acid reflux', 'gerd', 'heartburn', 'ppi', 'ulcer']
  },
  {
    name: 'Pantoprazole',
    genericName: 'Pantoprazole Sodium',
    category: 'Gastrointestinal',
    dosageForm: 'Tablet',
    commonStrengths: ['20mg', '40mg'],
    description: 'PPI for GERD and erosive esophagitis',
    tags: ['acid reflux', 'gerd', 'ppi', 'stomach']
  },
  
  // Antihistamines
  {
    name: 'Cetirizine',
    genericName: 'Cetirizine HCl',
    category: 'Antihistamine',
    dosageForm: 'Tablet',
    commonStrengths: ['5mg', '10mg'],
    description: 'Non-drowsy antihistamine for allergies',
    tags: ['allergy', 'antihistamine', 'zyrtec', 'hay fever']
  },
  {
    name: 'Loratadine',
    genericName: 'Loratadine',
    category: 'Antihistamine',
    dosageForm: 'Tablet',
    commonStrengths: ['10mg'],
    description: 'Non-drowsy antihistamine for allergies',
    tags: ['allergy', 'antihistamine', 'claritin', 'hay fever']
  },
  {
    name: 'Diphenhydramine',
    genericName: 'Diphenhydramine HCl',
    category: 'Antihistamine',
    dosageForm: 'Capsule',
    commonStrengths: ['25mg', '50mg'],
    description: 'Antihistamine for allergies and sleep aid',
    tags: ['allergy', 'antihistamine', 'benadryl', 'sleep']
  },
  
  // Respiratory
  {
    name: 'Albuterol',
    genericName: 'Albuterol Sulfate',
    category: 'Respiratory',
    dosageForm: 'Inhaler',
    commonStrengths: ['90mcg/actuation'],
    description: 'Bronchodilator for asthma and COPD',
    tags: ['asthma', 'copd', 'inhaler', 'bronchodilator', 'breathing']
  },
  {
    name: 'Montelukast',
    genericName: 'Montelukast Sodium',
    category: 'Respiratory',
    dosageForm: 'Tablet',
    commonStrengths: ['4mg', '5mg', '10mg'],
    description: 'Leukotriene inhibitor for asthma and allergies',
    tags: ['asthma', 'allergy', 'singulair', 'breathing']
  },
  
  // Psychiatric
  {
    name: 'Sertraline',
    genericName: 'Sertraline HCl',
    category: 'Psychiatric',
    dosageForm: 'Tablet',
    commonStrengths: ['25mg', '50mg', '100mg'],
    description: 'SSRI antidepressant for depression and anxiety',
    tags: ['depression', 'anxiety', 'ssri', 'zoloft', 'mental health']
  },
  {
    name: 'Fluoxetine',
    genericName: 'Fluoxetine HCl',
    category: 'Psychiatric',
    dosageForm: 'Capsule',
    commonStrengths: ['10mg', '20mg', '40mg'],
    description: 'SSRI for depression, OCD, and panic disorder',
    tags: ['depression', 'anxiety', 'ssri', 'prozac', 'ocd']
  },
  {
    name: 'Escitalopram',
    genericName: 'Escitalopram Oxalate',
    category: 'Psychiatric',
    dosageForm: 'Tablet',
    commonStrengths: ['5mg', '10mg', '20mg'],
    description: 'SSRI for depression and generalized anxiety',
    tags: ['depression', 'anxiety', 'ssri', 'lexapro', 'mental health']
  },
  
  // Neurological
  {
    name: 'Gabapentin',
    genericName: 'Gabapentin',
    category: 'Neurological',
    dosageForm: 'Capsule',
    commonStrengths: ['100mg', '300mg', '400mg', '600mg'],
    description: 'Anticonvulsant for seizures and nerve pain',
    tags: ['nerve pain', 'seizure', 'neuropathy', 'epilepsy']
  },
  {
    name: 'Pregabalin',
    genericName: 'Pregabalin',
    category: 'Neurological',
    dosageForm: 'Capsule',
    commonStrengths: ['25mg', '50mg', '75mg', '150mg', '300mg'],
    description: 'For nerve pain, fibromyalgia, and seizures',
    tags: ['nerve pain', 'fibromyalgia', 'lyrica', 'neuropathy']
  },
  
  // Supplements
  {
    name: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    category: 'Supplement',
    dosageForm: 'Tablet',
    commonStrengths: ['400IU', '1000IU', '2000IU', '5000IU'],
    description: 'Vitamin D supplement for bone health',
    tags: ['vitamin', 'supplement', 'bone health', 'd3']
  },
  {
    name: 'Vitamin B12',
    genericName: 'Cyanocobalamin',
    category: 'Supplement',
    dosageForm: 'Tablet',
    commonStrengths: ['500mcg', '1000mcg', '2500mcg'],
    description: 'B vitamin for energy and nerve function',
    tags: ['vitamin', 'supplement', 'energy', 'nerve']
  },
];

async function seedMedications() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri);
    console.log('Connected to MongoDB');

    // Check if medications already exist
    const existingCount = await Medication.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} medications.`);
      const answer = process.argv.includes('--force');
      if (!answer) {
        console.log('Use --force flag to clear and reseed.');
        process.exit(0);
      }
      console.log('Clearing existing medications...');
      await Medication.deleteMany({});
    }

    // Create a system user ID for seeding (in production, use actual admin user ID)
    const systemUserId = new mongoose.Types.ObjectId();

    // Add metadata to each medication
    const medicationsToInsert = commonMedications.map(med => ({
      ...med,
      source: 'predefined',
      createdBy: systemUserId,
      creatorRole: 'admin',
      isVerified: true,
      verifiedBy: systemUserId,
      verifiedAt: new Date(),
      usageCount: Math.floor(Math.random() * 100) // Random usage count for demo
    }));

    // Insert medications
    const result = await Medication.insertMany(medicationsToInsert);
    console.log(`Successfully seeded ${result.length} medications`);

    // Print summary by category
    const categories = [...new Set(commonMedications.map(m => m.category))];
    console.log('\nMedications by category:');
    for (const category of categories) {
      const count = commonMedications.filter(m => m.category === category).length;
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
