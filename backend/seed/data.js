const { faker } = require('@faker-js/faker');

// --- Configuration ---
const NUM_USERS = {
  patients: 100,
  doctors: 20,
  admins: 5,
};
const NUM_MEDICINES = 100;
const NUM_REPORTS = 250;
const NUM_PROGRESSIONS_PER_REPORT = 5;

// --- Helper Functions ---
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// --- Data Generation ---

// 1. Generate Users
const users = [];
const userIds = {
  patients: [],
  doctors: [],
  admins: [],
};

// Generate Patients
for (let i = 0; i < NUM_USERS.patients; i++) {
  const user = {
    _id: faker.database.mongodbObjectId(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: 'password123', // Plain text, will be hashed by Mongoose pre-save hook
    phone: faker.helpers.fromRegExp(/[0-9]{3}-[0-9]{3}-[0-9]{4}/),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
    gender: faker.helpers.arrayElement(['male', 'female', 'other']),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      country: 'USA',
    },
    role: 'patient',
    patientInfo: {
      emergencyContact: {
        name: faker.person.fullName(),
        relationship: faker.helpers.arrayElement(['Spouse', 'Parent', 'Sibling', 'Friend']),
        phone: faker.helpers.fromRegExp(/[0-9]{3}-[0-9]{3}-[0-9]{4}/),
      },
      bloodGroup: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
      allergies: getRandomSubset(
        ['Pollen', 'Dust Mites', 'Penicillin', 'Sulfa Drugs', 'Peanuts', 'Shellfish'],
        faker.number.int({ min: 0, max: 3 })
      ),
      chronicConditions: getRandomSubset(
        ['Hypertension', 'Diabetes Type 2', 'Asthma', 'Arthritis'],
        faker.number.int({ min: 0, max: 2 })
      ),
    },
    isEmailVerified: true,
    isActive: true,
  };
  users.push(user);
  userIds.patients.push(user._id);
}

// Generate Doctors
for (let i = 0; i < NUM_USERS.doctors; i++) {
  const user = {
    _id: faker.database.mongodbObjectId(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: 'password123',
    phone: faker.helpers.fromRegExp(/[0-9]{3}-[0-9]{3}-[0-9]{4}/),
    dateOfBirth: faker.date.birthdate({ min: 30, max: 65, mode: 'age' }),
    gender: faker.helpers.arrayElement(['male', 'female']),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      country: 'USA',
    },
    role: 'doctor',
    doctorInfo: {
      licenseNumber: faker.string.alphanumeric(10).toUpperCase(),
      specialization: faker.helpers.arrayElement(['Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'General Practice']),
      yearsOfExperience: faker.number.int({ min: 5, max: 35 }),
      consultationFee: faker.number.int({ min: 50, max: 300 }),
      biography: faker.lorem.paragraph(),
    },
    isEmailVerified: true,
    isActive: true,
  };
  users.push(user);
  userIds.doctors.push(user._id);
}

// Generate Admins
for (let i = 0; i < NUM_USERS.admins; i++) {
  const user = {
    _id: faker.database.mongodbObjectId(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: 'password123',
    phone: faker.helpers.fromRegExp(/[0-9]{3}-[0-9]{3}-[0-9]{4}/),
    dateOfBirth: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }),
    gender: faker.helpers.arrayElement(['male', 'female']),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      country: 'USA',
    },
    role: 'admin',
    adminInfo: {
      department: faker.helpers.arrayElement(['System Administration', 'User Management', 'Finance']),
      employeeId: faker.string.uuid(),
      permissions: ['user_management', 'system_settings'],
    },
    isEmailVerified: true,
    isActive: true,
  };
  users.push(user);
  userIds.admins.push(user._id);
}

// 2. Generate Medicines
const medicines = [];
const medicineIds = [];
const medicineCategories = [
  'Antibiotic', 'Analgesic', 'Antiviral', 'Antifungal', 'Antihistamine',
  'Cardiovascular', 'Diabetes', 'Respiratory', 'Gastrointestinal',
  'Neurological', 'Psychiatric', 'Dermatological', 'Hormonal',
];
const sideEffectTemplates = [
    { effect: 'Nausea', severity: 'Mild', frequency: 'Common' },
    { effect: 'Headache', severity: 'Mild', frequency: 'Common' },
    { effect: 'Dizziness', severity: 'Moderate', frequency: 'Uncommon' },
    { effect: 'Fatigue', severity: 'Mild', frequency: 'Very common' },
    { effect: 'Rash', severity: 'Moderate', frequency: 'Rare' },
    { effect: 'Anaphylaxis', severity: 'Life-threatening', frequency: 'Very rare' },
    { effect: 'Stomach Pain', severity: 'Moderate', frequency: 'Common' },
];


for (let i = 0; i < NUM_MEDICINES; i++) {
  const medicine = {
    _id: faker.database.mongodbObjectId(),
    name: faker.commerce.productName(),
    genericName: faker.lorem.word(),
    brandName: faker.company.name(),
    manufacturer: {
      name: faker.company.name(),
      country: faker.location.country(),
      licenseNumber: faker.string.alphanumeric(12).toUpperCase(),
    },
    category: getRandomElement(medicineCategories),
    therapeuticClass: faker.lorem.words(2),
    drugClass: faker.lorem.words(2),
    dosageForm: faker.helpers.arrayElement(['Tablet', 'Capsule', 'Syrup', 'Injection']),
    strength: {
      value: faker.number.int({ min: 10, max: 500 }),
      unit: 'mg',
    },
    route: [faker.helpers.arrayElement(['Oral', 'Intravenous', 'Topical'])],
    prescriptionRequired: faker.datatype.boolean(),
    indications: [{ condition: faker.lorem.word(), description: faker.lorem.sentence() }],
    knownSideEffects: getRandomSubset(sideEffectTemplates, faker.number.int({ min: 1, max: 4 })),
    createdBy: getRandomElement(userIds.admins),
    isActive: true,
  };
  medicines.push(medicine);
  medicineIds.push(medicine._id);
}

// 3. Generate Side Effect Reports
const reports = [];
const reportIds = [];

for (let i = 0; i < NUM_REPORTS; i++) {
  const patientId = getRandomElement(userIds.patients);
  const medicineId = getRandomElement(medicineIds);
  const reportedSideEffect = getRandomElement(medicines.find(m => m._id === medicineId).knownSideEffects);

  const report = {
    _id: faker.database.mongodbObjectId(),
    reportedBy: patientId,
    reporterRole: 'patient',
    medicine: medicineId,
    patient: patientId,
    sideEffects: [{
      effect: reportedSideEffect.effect,
      severity: reportedSideEffect.severity,
      onset: faker.helpers.arrayElement(['Within hours', 'Within days']),
      duration: { value: faker.number.int({ min: 1, max: 24 }), unit: 'hours' },
      bodySystem: faker.helpers.arrayElement(['Gastrointestinal', 'Nervous System', 'Dermatological']),
      description: faker.lorem.sentence(),
    }],
    medicationUsage: {
      indication: faker.lorem.word(),
      dosage: { amount: '1 tablet', frequency: 'Twice a day', route: 'Oral' },
      startDate: faker.date.recent({ days: 30 }),
    },
    reportDetails: {
      incidentDate: faker.date.recent({ days: 10 }),
      seriousness: reportedSideEffect.severity === 'Life-threatening' ? 'Serious' : 'Non-serious',
      outcome: faker.helpers.arrayElement(['Recovering', 'Not recovered', 'Recovered/Resolved']),
    },
    status: 'Submitted',
    isActive: true,
  };
  reports.push(report);
  reportIds.push(report._id);
}

// 4. Generate Symptom Progressions
const symptomProgressions = [];

for (const report of reports) {
  const progression = {
    _id: faker.database.mongodbObjectId(),
    originalReport: report._id,
    patient: report.patient,
    medicine: report.medicine,
    symptom: {
      originalSideEffectId: faker.database.mongodbObjectId(), // Placeholder
      name: report.sideEffects[0].effect,
      bodySystem: report.sideEffects[0].bodySystem,
    },
    timeline: {
      startDate: report.reportDetails.incidentDate,
      isOngoing: true,
    },
    progressionEntries: [],
    status: 'Active',
    isActive: true,
  };

  let lastSeverity = faker.number.int({ min: 4, max: 8 });
  for (let i = 0; i < NUM_PROGRESSIONS_PER_REPORT; i++) {
    const entryDate = faker.date.soon({ days: 2, refDate: progression.timeline.startDate });
    lastSeverity = Math.max(0, Math.min(10, lastSeverity + faker.number.int({ min: -2, max: 1 })));

    progression.progressionEntries.push({
      entryDate,
      daysSinceOnset: Math.round((entryDate - progression.timeline.startDate) / (1000 * 60 * 60 * 24)),
      severity: {
        level: lastSeverity > 7 ? 'Severe' : lastSeverity > 3 ? 'Moderate' : 'Mild',
        numericScore: lastSeverity,
      },
      frequency: 'Intermittent',
      pattern: 'Fluctuating',
      enteredBy: report.patient,
      dataSource: 'Patient',
    });
  }
  symptomProgressions.push(progression);
}


module.exports = {
  users,
  medicines,
  reports,
  symptomProgressions,
};
