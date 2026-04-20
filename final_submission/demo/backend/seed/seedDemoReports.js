const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Connection URI
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adr_system';

const seedDemoData = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for demo data seeding.');

    const User = mongoose.model('User', require('../models/User').schema);
    const Medication = mongoose.model('Medication', require('../models/Medication').schema);
    const ReportSideEffect = mongoose.model('ReportSideEffect', require('../models/ReportSideEffect').schema);

    // Check if demo users exist
    const existingPatient = await User.findOne({ email: 'patient@demo.com' });
    const existingDoctor = await User.findOne({ email: 'doctor@demo.com' });

    if (!existingPatient || !existingDoctor) {
      console.log('Demo users not found. Please run seedDemoUsers.js first.');
      process.exit(1);
    }

    console.log('Found demo users:');
    console.log('- Patient:', existingPatient._id, existingPatient.email);
    console.log('- Doctor:', existingDoctor._id, existingDoctor.email);

    // Get or create some medications
    let medications = await Medication.find().limit(5);
    if (medications.length === 0) {
      console.log('Creating sample medications...');
      const sampleMeds = [
        { name: 'Aspirin', genericName: 'acetylsalicylic acid', category: 'Analgesic', dosageForm: 'Tablet', isActive: true, isVerified: true },
        { name: 'Lisinopril', genericName: 'lisinopril', category: 'Cardiovascular', dosageForm: 'Tablet', isActive: true, isVerified: true },
        { name: 'Metformin', genericName: 'metformin hydrochloride', category: 'Diabetes', dosageForm: 'Tablet', isActive: true, isVerified: true },
        { name: 'Omeprazole', genericName: 'omeprazole', category: 'Gastrointestinal', dosageForm: 'Capsule', isActive: true, isVerified: true },
        { name: 'Amoxicillin', genericName: 'amoxicillin', category: 'Antibiotic', dosageForm: 'Capsule', isActive: true, isVerified: true },
      ];
      medications = await Medication.insertMany(sampleMeds);
      console.log(`Created ${medications.length} sample medications.`);
    }

    // Clear existing reports for demo patient
    await ReportSideEffect.deleteMany({ reportedBy: existingPatient._id });
    console.log('Cleared existing reports for demo patient.');

    // Create demo reports with different scenarios
    const demoReports = [
      {
        // Report 1: Severe case with review requested
        reportedBy: existingPatient._id,
        reporterRole: 'patient',
        medicine: medications[0]._id, // Aspirin
        patient: existingPatient._id,
        sideEffects: [{
          effect: 'Severe stomach pain and bleeding',
          severity: 'Severe',
          onset: 'Within days',
          duration: { value: 3, unit: 'days' },
          bodySystem: 'Gastrointestinal',
          frequency: 'Continuous',
          description: 'Started experiencing severe stomach pain 3 days after starting aspirin. Noticed blood in stool.',
          treatmentRequired: true,
          treatment: 'Stopped medication, taking antacids'
        }],
        medicationUsage: {
          indication: 'Pain relief and heart protection',
          dosage: { amount: '100mg', frequency: 'Once daily', route: 'Oral' },
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          adherence: 'Good'
        },
        reportDetails: {
          incidentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          seriousness: 'Serious',
          outcome: 'Recovering',
          reportDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          seriousnessReason: ['Hospitalization']
        },
        patientInfo: {
          age: 55,
          gender: 'male',
          medicalHistory: ['Hypertension', 'Previous ulcer'],
          allergies: []
        },
        status: 'Submitted',
        priority: 'High',
        doctorReview: {
          requested: true,
          requestedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          requestedBy: existingPatient._id,
          requestReason: 'I am very concerned about the bleeding. Is this serious? Should I see a specialist?',
          status: 'pending'
        },
        metadata: {
          aiProcessed: true,
          aiProcessedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          aiRiskScore: 75,
          aiAnalysis: {
            severity: { level: 'Severe', confidence: 0.9, reasoning: 'GI bleeding is a known serious complication of aspirin use, particularly in patients with history of ulcers.' },
            seriousness: { classification: 'Serious', reasons: ['Hospitalization required', 'Potentially life-threatening'] },
            causalityAssessment: { likelihood: 'Probable', reasoning: 'Aspirin is known to cause GI bleeding, patient has risk factors.' },
            patientGuidance: {
              urgencyLevel: 'urgent',
              recommendation: 'This is a serious side effect that requires immediate medical attention. Stop taking aspirin and consult your doctor immediately.',
              nextSteps: ['Stop taking aspirin immediately', 'Seek medical evaluation today', 'Monitor for signs of severe bleeding'],
              warningSignsToWatch: ['Black or bloody stools', 'Vomiting blood', 'Severe dizziness', 'Fainting'],
              canContinueMedication: false,
              shouldSeekMedicalAttention: true
            },
            priority: 'High',
            summary: 'Patient experiencing GI bleeding likely related to aspirin use. High risk due to history of ulcer. Requires urgent medical evaluation.',
            recommendedActions: ['Discontinue aspirin', 'Schedule urgent GI consultation', 'Consider PPI therapy', 'Monitor hemoglobin levels'],
            overallRiskScore: 75
          }
        }
      },
      {
        // Report 2: Moderate case with review requested
        reportedBy: existingPatient._id,
        reporterRole: 'patient',
        medicine: medications[1]._id, // Lisinopril
        patient: existingPatient._id,
        sideEffects: [{
          effect: 'Persistent dry cough',
          severity: 'Moderate',
          onset: 'Within days',
          duration: { value: 2, unit: 'weeks' },
          bodySystem: 'Respiratory',
          frequency: 'Continuous',
          description: 'Developed a persistent dry cough about a week after starting lisinopril. Cough is worse at night.',
          treatmentRequired: false
        }],
        medicationUsage: {
          indication: 'High blood pressure',
          dosage: { amount: '10mg', frequency: 'Once daily', route: 'Oral' },
          startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
          adherence: 'Good'
        },
        reportDetails: {
          incidentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          seriousness: 'Non-serious',
          outcome: 'Not recovered',
          reportDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        patientInfo: {
          age: 55,
          gender: 'male',
          medicalHistory: ['Hypertension'],
          allergies: []
        },
        status: 'Submitted',
        priority: 'Medium',
        doctorReview: {
          requested: true,
          requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          requestedBy: existingPatient._id,
          requestReason: 'The cough is affecting my sleep. Should I switch to a different medication?',
          status: 'pending'
        },
        metadata: {
          aiProcessed: true,
          aiProcessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          aiRiskScore: 35,
          aiAnalysis: {
            severity: { level: 'Moderate', confidence: 0.85, reasoning: 'ACE inhibitor-induced cough is a well-known class effect, affecting 5-35% of patients.' },
            seriousness: { classification: 'Non-serious', reasons: [] },
            causalityAssessment: { likelihood: 'Probable', reasoning: 'Dry cough is a classic side effect of ACE inhibitors like lisinopril.' },
            patientGuidance: {
              urgencyLevel: 'soon',
              recommendation: 'This is a common side effect of ACE inhibitors. While not dangerous, it can be bothersome. Discuss switching to an ARB with your doctor.',
              nextSteps: ['Continue medication for now unless unbearable', 'Schedule appointment with doctor within 1-2 weeks', 'Try elevating head while sleeping'],
              warningSignsToWatch: ['Difficulty breathing', 'Swelling of face or throat', 'Wheezing'],
              canContinueMedication: true,
              shouldSeekMedicalAttention: false
            },
            priority: 'Medium',
            summary: 'Patient experiencing classic ACE inhibitor-induced cough. Common side effect, consider switching to ARB if persistent.',
            recommendedActions: ['Consider switching to ARB (e.g., losartan)', 'Reassure patient about non-serious nature', 'Schedule follow-up'],
            overallRiskScore: 35
          }
        }
      },
      {
        // Report 3: Mild case - no review requested
        reportedBy: existingPatient._id,
        reporterRole: 'patient',
        medicine: medications[2]._id, // Metformin
        patient: existingPatient._id,
        sideEffects: [{
          effect: 'Mild nausea after meals',
          severity: 'Mild',
          onset: 'Within hours',
          duration: { value: 1, unit: 'hours' },
          bodySystem: 'Gastrointestinal',
          frequency: 'Intermittent',
          description: 'Slight nausea after taking metformin with breakfast. Goes away on its own.',
          treatmentRequired: false
        }],
        medicationUsage: {
          indication: 'Type 2 Diabetes',
          dosage: { amount: '500mg', frequency: 'Twice daily', route: 'Oral' },
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          adherence: 'Good'
        },
        reportDetails: {
          incidentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          seriousness: 'Non-serious',
          outcome: 'Recovered/Resolved',
          reportDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        patientInfo: {
          age: 55,
          gender: 'male',
          medicalHistory: ['Type 2 Diabetes'],
          allergies: []
        },
        status: 'Submitted',
        priority: 'Low',
        doctorReview: {
          requested: false,
          status: 'not_requested'
        },
        metadata: {
          aiProcessed: true,
          aiProcessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          aiRiskScore: 15,
          aiAnalysis: {
            severity: { level: 'Mild', confidence: 0.9, reasoning: 'Mild GI upset is very common when starting metformin and usually resolves.' },
            seriousness: { classification: 'Non-serious', reasons: [] },
            causalityAssessment: { likelihood: 'Possible', reasoning: 'GI side effects are common with metformin, especially when starting.' },
            patientGuidance: {
              urgencyLevel: 'routine',
              recommendation: 'Mild nausea is a common initial side effect of metformin. It usually improves with time. Taking it with food can help.',
              nextSteps: ['Take medication with food', 'Give it 2-4 weeks to improve', 'Stay well hydrated'],
              warningSignsToWatch: ['Severe vomiting', 'Inability to keep food down', 'Signs of dehydration'],
              canContinueMedication: true,
              shouldSeekMedicalAttention: false
            },
            priority: 'Low',
            summary: 'Patient experiencing common metformin GI side effects. Expected to resolve with continued use.',
            recommendedActions: ['Advise taking with food', 'Reassure about temporary nature', 'Follow up in 2-4 weeks if persists'],
            overallRiskScore: 15
          }
        }
      },
      {
        // Report 4: Another pending review
        reportedBy: existingPatient._id,
        reporterRole: 'patient',
        medicine: medications[4]._id, // Amoxicillin
        patient: existingPatient._id,
        sideEffects: [{
          effect: 'Skin rash on arms and chest',
          severity: 'Moderate',
          onset: 'Within days',
          duration: { value: 2, unit: 'days' },
          bodySystem: 'Dermatological',
          frequency: 'Continuous',
          description: 'Developed itchy red rash on arms and chest 3 days after starting amoxicillin for throat infection.',
          treatmentRequired: true,
          treatment: 'Stopped antibiotic, taking antihistamine'
        }],
        medicationUsage: {
          indication: 'Throat infection',
          dosage: { amount: '500mg', frequency: 'Three times daily', route: 'Oral' },
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          adherence: 'Good'
        },
        reportDetails: {
          incidentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          seriousness: 'Non-serious',
          outcome: 'Recovering',
          reportDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        patientInfo: {
          age: 55,
          gender: 'male',
          medicalHistory: [],
          allergies: []
        },
        status: 'Submitted',
        priority: 'Medium',
        doctorReview: {
          requested: true,
          requestedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          requestedBy: existingPatient._id,
          requestReason: 'Is this an allergic reaction? Will I be allergic to other antibiotics too?',
          status: 'pending'
        },
        metadata: {
          aiProcessed: true,
          aiProcessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          aiRiskScore: 45,
          aiAnalysis: {
            severity: { level: 'Moderate', confidence: 0.8, reasoning: 'Drug-induced rash requires evaluation to distinguish between allergic reaction and non-allergic drug eruption.' },
            seriousness: { classification: 'Non-serious', reasons: [] },
            causalityAssessment: { likelihood: 'Probable', reasoning: 'Rash developed after starting amoxicillin, consistent with drug reaction.' },
            patientGuidance: {
              urgencyLevel: 'soon',
              recommendation: 'You may be having an allergic reaction to amoxicillin. Stop taking the medication and see your doctor to discuss alternative antibiotics.',
              nextSteps: ['Stop taking amoxicillin', 'Continue antihistamines for itching', 'See your doctor within 1-2 days', 'Take photos of the rash'],
              warningSignsToWatch: ['Difficulty breathing', 'Swelling of face/lips/tongue', 'Blistering skin', 'High fever'],
              canContinueMedication: false,
              shouldSeekMedicalAttention: true
            },
            priority: 'Medium',
            summary: 'Patient experiencing probable amoxicillin-induced rash. May indicate penicillin allergy. Needs evaluation for alternative antibiotic.',
            recommendedActions: ['Discontinue amoxicillin', 'Document potential penicillin allergy', 'Consider allergy testing', 'Prescribe alternative antibiotic if needed'],
            overallRiskScore: 45
          }
        }
      }
    ];

    // Insert demo reports
    const insertedReports = await ReportSideEffect.insertMany(demoReports);
    console.log(`Created ${insertedReports.length} demo reports.`);

    console.log('\n✅ Demo data seeded successfully!');
    console.log('\nSummary:');
    console.log(`- ${insertedReports.filter(r => r.doctorReview?.requested).length} reports with pending review requests`);
    console.log(`- ${insertedReports.filter(r => r.priority === 'High').length} high priority reports`);
    console.log(`- ${insertedReports.filter(r => r.sideEffects[0]?.severity === 'Severe').length} severe cases`);

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
  }
};

seedDemoData();
