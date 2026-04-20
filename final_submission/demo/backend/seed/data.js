const { faker } = require('@faker-js/faker');
const medicationCatalog = require('./medicationCatalog');

// --- Configuration ---
const NUM_USERS = {
  patients: 100,
  doctors: 20,
  admins: 5,
};
const NUM_MEDICINES = medicationCatalog.length;
const NUM_REPORTS = 250;
const NUM_PROGRESSIONS_PER_REPORT = 5;

// --- Helper Functions ---
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};
const randomUsPhone = () =>
  `+1-${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`;

const routeByDosageForm = {
  Tablet: 'Oral',
  Capsule: 'Oral',
  'Liquid/Syrup': 'Oral',
  Injection: 'Intramuscular',
  'Cream/Ointment': 'Topical',
  Drops: 'Ophthalmic',
  Inhaler: 'Inhalation',
  Patch: 'Topical',
  Powder: 'Oral',
  Other: 'Oral'
};

const categoryIndications = {
  Analgesic: ['Acute pain', 'Headache', 'Musculoskeletal pain', 'Fever'],
  Antibiotic: ['Respiratory infection', 'Urinary tract infection', 'Skin infection', 'Bacterial sinusitis'],
  Antiviral: ['Influenza', 'Herpes simplex infection', 'Herpes zoster', 'Viral infection'],
  Antifungal: ['Fungal skin infection', 'Oral candidiasis', 'Vaginal candidiasis', 'Onychomycosis'],
  Antihistamine: ['Allergic rhinitis', 'Urticaria', 'Seasonal allergies', 'Pruritus'],
  Cardiovascular: ['Hypertension', 'Hyperlipidemia', 'Heart failure', 'Atrial fibrillation prevention'],
  Diabetes: ['Type 2 diabetes mellitus', 'Glycemic control', 'Insulin replacement'],
  Respiratory: ['Asthma', 'COPD', 'Bronchospasm', 'Allergic airway inflammation'],
  Gastrointestinal: ['GERD', 'Dyspepsia', 'Nausea and vomiting', 'Constipation'],
  Neurological: ['Neuropathic pain', 'Epilepsy', 'Migraine', 'Seizure disorder'],
  Psychiatric: ['Major depressive disorder', 'Generalized anxiety disorder', 'Insomnia', 'Panic disorder'],
  Dermatological: ['Dermatitis', 'Acne vulgaris', 'Localized skin infection', 'Eczema flare'],
  Hormonal: ['Hypothyroidism', 'Contraception', 'Inflammatory disorder', 'Hormonal regulation'],
  Supplement: ['Micronutrient deficiency', 'Anemia support', 'Prenatal supplementation', 'Bone health support'],
  Other: ['Chronic condition management']
};

const categorySideEffectTemplates = {
  Analgesic: [
    { effect: 'Nausea', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Epigastric discomfort', severity: 'Moderate', bodySystem: 'Gastrointestinal' },
    { effect: 'Dizziness', severity: 'Mild', bodySystem: 'Nervous System' },
    { effect: 'Rash', severity: 'Moderate', bodySystem: 'Dermatological' },
    { effect: 'Gastrointestinal bleeding symptoms', severity: 'Severe', bodySystem: 'Gastrointestinal' }
  ],
  Antibiotic: [
    { effect: 'Diarrhea', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Nausea', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Maculopapular rash', severity: 'Moderate', bodySystem: 'Dermatological' },
    { effect: 'Abdominal cramping', severity: 'Moderate', bodySystem: 'Gastrointestinal' },
    { effect: 'Allergic reaction', severity: 'Severe', bodySystem: 'Dermatological' }
  ],
  Antiviral: [
    { effect: 'Headache', severity: 'Mild', bodySystem: 'Nervous System' },
    { effect: 'Fatigue', severity: 'Mild', bodySystem: 'Other' },
    { effect: 'Nausea', severity: 'Moderate', bodySystem: 'Gastrointestinal' },
    { effect: 'Dizziness', severity: 'Moderate', bodySystem: 'Nervous System' }
  ],
  Antifungal: [
    { effect: 'Nausea', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Abdominal pain', severity: 'Moderate', bodySystem: 'Gastrointestinal' },
    { effect: 'Skin irritation at application site', severity: 'Mild', bodySystem: 'Dermatological' },
    { effect: 'Elevated liver enzyme symptoms', severity: 'Severe', bodySystem: 'Gastrointestinal' }
  ],
  Antihistamine: [
    { effect: 'Drowsiness', severity: 'Mild', bodySystem: 'Nervous System' },
    { effect: 'Dry mouth', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Headache', severity: 'Mild', bodySystem: 'Nervous System' },
    { effect: 'Dizziness', severity: 'Moderate', bodySystem: 'Nervous System' }
  ],
  Cardiovascular: [
    { effect: 'Dizziness on standing', severity: 'Moderate', bodySystem: 'Cardiovascular' },
    { effect: 'Dry cough', severity: 'Mild', bodySystem: 'Respiratory' },
    { effect: 'Peripheral edema', severity: 'Moderate', bodySystem: 'Cardiovascular' },
    { effect: 'Bradycardia symptoms', severity: 'Severe', bodySystem: 'Cardiovascular' },
    { effect: 'Fatigue', severity: 'Mild', bodySystem: 'Other' }
  ],
  Diabetes: [
    { effect: 'Gastrointestinal upset', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Hypoglycemia symptoms', severity: 'Severe', bodySystem: 'Endocrine' },
    { effect: 'Increased urination', severity: 'Moderate', bodySystem: 'Genitourinary' },
    { effect: 'Genital yeast infection symptoms', severity: 'Moderate', bodySystem: 'Genitourinary' },
    { effect: 'Injection site reaction', severity: 'Mild', bodySystem: 'Dermatological' }
  ],
  Respiratory: [
    { effect: 'Tremor', severity: 'Mild', bodySystem: 'Nervous System' },
    { effect: 'Palpitations', severity: 'Moderate', bodySystem: 'Cardiovascular' },
    { effect: 'Throat irritation', severity: 'Mild', bodySystem: 'Respiratory' },
    { effect: 'Oral candidiasis symptoms', severity: 'Moderate', bodySystem: 'Respiratory' },
    { effect: 'Dry mouth', severity: 'Mild', bodySystem: 'Gastrointestinal' }
  ],
  Gastrointestinal: [
    { effect: 'Headache', severity: 'Mild', bodySystem: 'Nervous System' },
    { effect: 'Constipation', severity: 'Moderate', bodySystem: 'Gastrointestinal' },
    { effect: 'Diarrhea', severity: 'Moderate', bodySystem: 'Gastrointestinal' },
    { effect: 'Abdominal discomfort', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Prolonged QT symptoms', severity: 'Severe', bodySystem: 'Cardiovascular' }
  ],
  Neurological: [
    { effect: 'Somnolence', severity: 'Moderate', bodySystem: 'Nervous System' },
    { effect: 'Dizziness', severity: 'Moderate', bodySystem: 'Nervous System' },
    { effect: 'Paresthesia', severity: 'Mild', bodySystem: 'Nervous System' },
    { effect: 'Coordination difficulty', severity: 'Moderate', bodySystem: 'Nervous System' },
    { effect: 'Mood changes', severity: 'Severe', bodySystem: 'Psychiatric' }
  ],
  Psychiatric: [
    { effect: 'Nausea', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Insomnia', severity: 'Moderate', bodySystem: 'Psychiatric' },
    { effect: 'Sexual dysfunction', severity: 'Moderate', bodySystem: 'Genitourinary' },
    { effect: 'Weight change', severity: 'Mild', bodySystem: 'Endocrine' },
    { effect: 'Serotonin toxicity symptoms', severity: 'Life-threatening', bodySystem: 'Nervous System' }
  ],
  Dermatological: [
    { effect: 'Application site burning', severity: 'Mild', bodySystem: 'Dermatological' },
    { effect: 'Skin dryness', severity: 'Mild', bodySystem: 'Dermatological' },
    { effect: 'Contact dermatitis', severity: 'Moderate', bodySystem: 'Dermatological' },
    { effect: 'Pruritus', severity: 'Mild', bodySystem: 'Dermatological' }
  ],
  Hormonal: [
    { effect: 'Weight gain', severity: 'Moderate', bodySystem: 'Endocrine' },
    { effect: 'Mood changes', severity: 'Moderate', bodySystem: 'Psychiatric' },
    { effect: 'Fluid retention', severity: 'Moderate', bodySystem: 'Cardiovascular' },
    { effect: 'Menstrual irregularity', severity: 'Moderate', bodySystem: 'Genitourinary' },
    { effect: 'Hyperglycemia symptoms', severity: 'Severe', bodySystem: 'Endocrine' }
  ],
  Supplement: [
    { effect: 'Constipation', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Nausea', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Abdominal discomfort', severity: 'Mild', bodySystem: 'Gastrointestinal' },
    { effect: 'Metallic taste', severity: 'Mild', bodySystem: 'Gastrointestinal' }
  ],
  Other: [
    { effect: 'Headache', severity: 'Mild', bodySystem: 'Nervous System' },
    { effect: 'Fatigue', severity: 'Mild', bodySystem: 'Other' }
  ]
};

const onsetOptions = ['Immediate', 'Within hours', 'Within days', 'Within weeks'];
const sideEffectFrequencies = ['Once', 'Intermittent', 'Continuous'];
const reportOutcomes = ['Recovered/Resolved', 'Recovering', 'Not recovered', 'Unknown'];

const getRouteForMedication = (medication) => {
  if (medication.dosageForm === 'Injection') {
    if (medication.category === 'Diabetes') return 'Subcutaneous';
    if (medication.name === 'Medroxyprogesterone') return 'Intramuscular';
    return 'Intravenous';
  }

  return routeByDosageForm[medication.dosageForm] || 'Oral';
};

const randomUsageFrequency = () =>
  getRandomElement(['Once daily', 'Twice daily', 'Every 8 hours', 'As needed']);

const randomDuration = () => {
  const unit = getRandomElement(['hours', 'days', 'weeks', 'ongoing']);
  if (unit === 'ongoing') return { value: 1, unit };

  const maxByUnit = {
    hours: 72,
    days: 14,
    weeks: 8
  };

  return {
    value: faker.number.int({ min: 1, max: maxByUnit[unit] }),
    unit
  };
};

const severityToPriority = {
  Mild: 'Low',
  Moderate: 'Medium',
  Severe: 'High',
  'Life-threatening': 'Critical'
};

// --- Data Generation ---

// 1. Generate Users
const users = [];
const userIds = {
  patients: [],
  doctors: [],
  admins: [],
};

for (let i = 0; i < NUM_USERS.patients; i++) {
  const user = {
    _id: faker.database.mongodbObjectId(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: 'Seed@123',
    phone: randomUsPhone(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
    gender: faker.helpers.arrayElement(['male', 'female', 'other']),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####'),
      country: 'USA',
    },
    role: 'patient',
    patientInfo: {
      emergencyContact: {
        name: faker.person.fullName(),
        relationship: faker.helpers.arrayElement(['Spouse', 'Parent', 'Sibling', 'Friend']),
        phone: randomUsPhone(),
      },
      bloodGroup: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
      allergies: getRandomSubset(
        ['Pollen', 'Penicillin', 'Shellfish', 'Peanuts', 'Dust'],
        faker.number.int({ min: 0, max: 2 })
      ),
      chronicConditions: getRandomSubset(
        ['Hypertension', 'Type 2 diabetes', 'Asthma', 'Hypothyroidism'],
        faker.number.int({ min: 0, max: 2 })
      ),
    },
    isEmailVerified: true,
    isActive: true,
  };

  users.push(user);
  userIds.patients.push(user._id);
}

for (let i = 0; i < NUM_USERS.doctors; i++) {
  const user = {
    _id: faker.database.mongodbObjectId(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: 'Seed@123',
    phone: randomUsPhone(),
    dateOfBirth: faker.date.birthdate({ min: 30, max: 65, mode: 'age' }),
    gender: faker.helpers.arrayElement(['male', 'female', 'other']),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####'),
      country: 'USA',
    },
    role: 'doctor',
    doctorInfo: {
      licenseNumber: faker.string.alphanumeric(10).toUpperCase(),
      specialization: faker.helpers.arrayElement([
        'General Practice',
        'Internal Medicine',
        'Cardiology',
        'Neurology',
        'Dermatology',
        'Endocrinology'
      ]),
      yearsOfExperience: faker.number.int({ min: 3, max: 35 }),
      consultationFee: faker.number.int({ min: 75, max: 350 }),
      biography: faker.lorem.sentences(2),
    },
    isEmailVerified: true,
    isActive: true,
  };

  users.push(user);
  userIds.doctors.push(user._id);
}

for (let i = 0; i < NUM_USERS.admins; i++) {
  const user = {
    _id: faker.database.mongodbObjectId(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: 'Seed@123',
    phone: randomUsPhone(),
    dateOfBirth: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }),
    gender: faker.helpers.arrayElement(['male', 'female', 'other']),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####'),
      country: 'USA',
    },
    role: 'admin',
    adminInfo: {
      department: faker.helpers.arrayElement(['Clinical Ops', 'System Administration', 'Compliance']),
      employeeId: faker.string.uuid(),
      permissions: [
        'user_management',
        'doctor_management',
        'patient_management',
        'system_settings',
        'reports'
      ],
    },
    isEmailVerified: true,
    isActive: true,
  };

  users.push(user);
  userIds.admins.push(user._id);
}

// 2. Generate Medications from curated catalog
const medicines = [];
const medicineIds = [];

for (const baseMedication of medicationCatalog) {
  const creatorRole = faker.helpers.arrayElement(['admin', 'doctor']);
  const creatorId =
    creatorRole === 'admin'
      ? getRandomElement(userIds.admins)
      : getRandomElement(userIds.doctors);

  const medication = {
    _id: faker.database.mongodbObjectId(),
    ...baseMedication,
    source: 'predefined',
    createdBy: creatorId,
    creatorRole,
    isActive: true,
    isVerified: true,
    usageCount: faker.number.int({ min: 25, max: 2000 }),
  };

  medicines.push(medication);
  medicineIds.push(medication._id);
}

// 3. Generate Side Effect Reports with clinically plausible matching
const reports = [];
const reportIds = [];

for (let i = 0; i < NUM_REPORTS; i++) {
  const patientId = getRandomElement(userIds.patients);
  const medicine = getRandomElement(medicines);
  const sideEffectPool = categorySideEffectTemplates[medicine.category] || categorySideEffectTemplates.Other;
  const selectedEffect = getRandomElement(sideEffectPool);

  const incidentDate = faker.date.recent({ days: 45 });
  const startDate = faker.date.between({
    from: new Date(incidentDate.getTime() - 1000 * 60 * 60 * 24 * 90),
    to: new Date(incidentDate.getTime() - 1000 * 60 * 60 * 6),
  });

  const report = {
    _id: faker.database.mongodbObjectId(),
    reportedBy: patientId,
    reporterRole: 'patient',
    medicine: medicine._id,
    patient: patientId,
    medicineDetails: {
      dosageForm: medicine.dosageForm,
      strength: getRandomElement(medicine.commonStrengths.length ? medicine.commonStrengths : ['standard dose'])
    },
    sideEffects: [
      {
        effect: selectedEffect.effect,
        severity: selectedEffect.severity,
        onset: getRandomElement(onsetOptions),
        duration: randomDuration(),
        frequency: getRandomElement(sideEffectFrequencies),
        bodySystem: selectedEffect.bodySystem,
        description: faker.lorem.sentence(),
      },
    ],
    medicationUsage: {
      indication: getRandomElement(categoryIndications[medicine.category] || categoryIndications.Other),
      dosage: {
        amount: getRandomElement(medicine.commonStrengths.length ? medicine.commonStrengths : ['standard dose']),
        frequency: randomUsageFrequency(),
        route: getRouteForMedication(medicine),
      },
      startDate,
      adherence: getRandomElement(['Excellent', 'Good', 'Poor', 'Unknown']),
      missedDoses: faker.number.int({ min: 0, max: 6 }),
    },
    reportDetails: {
      incidentDate,
      reportDate: faker.date.between({ from: incidentDate, to: new Date() }),
      seriousness: ['Severe', 'Life-threatening'].includes(selectedEffect.severity) ? 'Serious' : 'Non-serious',
      outcome: getRandomElement(reportOutcomes),
    },
    status: getRandomElement(['Submitted', 'Submitted', 'Under Review', 'Reviewed']),
    priority: severityToPriority[selectedEffect.severity] || 'Medium',
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
      originalSideEffectId: faker.database.mongodbObjectId(),
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

  let lastSeverity = faker.number.int({ min: 3, max: 8 });

  for (let i = 0; i < NUM_PROGRESSIONS_PER_REPORT; i++) {
    const entryDate = faker.date.soon({ days: 10, refDate: progression.timeline.startDate });
    lastSeverity = Math.max(0, Math.min(10, lastSeverity + faker.number.int({ min: -2, max: 1 })));

    const severityLevel =
      lastSeverity > 8 ? 'Life-threatening' :
      lastSeverity > 6 ? 'Severe' :
      lastSeverity > 3 ? 'Moderate' :
      lastSeverity > 0 ? 'Mild' : 'None';

    progression.progressionEntries.push({
      entryDate,
      daysSinceOnset: Math.max(0, Math.round((entryDate - progression.timeline.startDate) / (1000 * 60 * 60 * 24))),
      severity: {
        level: severityLevel,
        numericScore: lastSeverity,
      },
      frequency: getRandomElement(['Frequent', 'Occasional', 'Intermittent', 'Constant']),
      pattern: getRandomElement(['Improving', 'Worsening', 'Stable', 'Fluctuating']),
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
  metadata: {
    users: users.length,
    medicines: NUM_MEDICINES,
    reports: reports.length,
    progressions: symptomProgressions.length,
  }
};
