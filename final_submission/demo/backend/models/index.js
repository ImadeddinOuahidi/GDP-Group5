// Model relationships and usage examples

const User = require('./User');
const Medication = require('./Medication'); // Simplified medication system for side effect reporting
const ReportSideEffect = require('./ReportSideEffect');

/**
 * Model Relationships:
 * 
 * SIMPLIFIED MEDICATION SYSTEM:
 * 
 * 1. User (Doctor/Admin) -> Medication (One-to-Many)
 *    - Doctors create predefined medications for patients to choose from
 *    - Medication.createdBy references User._id
 * 
 * 2. User (Patient) -> Medication (One-to-Many)
 *    - Patients can create custom medications if not found in predefined list
 *    - These are marked as source: 'patient' and need verification
 * 
 * 3. Medication -> ReportSideEffect (One-to-Many)
 *    - A medication can have multiple side effect reports
 *    - ReportSideEffect.medication references Medication._id
 * 
 * 4. User (Patient) -> ReportSideEffect (One-to-Many)
 *    - A patient can report multiple side effects
 *    - ReportSideEffect.reportedBy references User._id
 */

// Example usage patterns:

// 1. Get all side effect reports for a specific medication
async function getSideEffectReportsForMedication(medicationId) {
  return await ReportSideEffect.findByMedicine(medicationId);
}

// 2. Get all reports submitted by a user
async function getReportsByUser(userId) {
  return await ReportSideEffect.find({ reportedBy: userId })
    .populate('medicine', 'name genericName')
    .populate('patient', 'firstName lastName');
}

// 3. Get patient's medical history including reported side effects
async function getPatientMedicalHistory(patientId) {
  const patient = await User.findById(patientId)
    .populate('sideEffectReports')
    .populate('patientReports');
  
  return {
    personalInfo: {
      name: patient.fullName,
      age: patient.age,
      bloodGroup: patient.patientInfo?.bloodGroup,
      allergies: patient.patientInfo?.allergies,
      chronicConditions: patient.patientInfo?.chronicConditions
    },
    reportedSideEffects: patient.sideEffectReports,
    sideEffectReportsAbout: patient.patientReports
  };
}

// 4. Get medications by category with their side effect statistics
async function getMedicationsWithSideEffectStats(category) {
  const medications = await Medication.getByCategory(category);
  
  const medicationsWithStats = await Promise.all(medications.map(async (medication) => {
    const reports = await ReportSideEffect.find({ medicine: medication._id });
    const seriousReports = reports.filter(r => r.reportDetails.seriousness === 'Serious');
    
    return {
      ...medication.toObject(),
      sideEffectStats: {
        totalReports: reports.length,
        seriousReports: seriousReports.length,
        mostCommonSideEffects: getMostCommonSideEffects(reports)
      }
    };
  }));
  
  return medicationsWithStats;
}

// Helper function to get most common side effects
function getMostCommonSideEffects(reports) {
  const sideEffectCounts = {};
  
  reports.forEach(report => {
    report.sideEffects.forEach(effect => {
      sideEffectCounts[effect.effect] = (sideEffectCounts[effect.effect] || 0) + 1;
    });
  });
  
  return Object.entries(sideEffectCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([effect, count]) => ({ effect, count }));
}

// 5. Find doctors specializing in specific conditions
async function getDoctorsBySpecialization(specialization) {
  const doctors = await User.find({ 
    role: 'doctor',
    'doctorInfo.specialization': specialization,
    isActive: true
  });
  
  return doctors;
}

// 6. Advanced query: Find medications with high-severity side effects
async function getMedicationsWithHighSeveritySideEffects() {
  const highSeverityReports = await ReportSideEffect.find({
    'sideEffects.severity': { $in: ['Severe', 'Life-threatening'] },
    'reportDetails.seriousness': 'Serious'
  }).populate('medicine');
  
  const medicationIds = [...new Set(highSeverityReports.map(r => r.medicine._id))];
  return await Medication.find({ _id: { $in: medicationIds } });
}

module.exports = {
  User,
  Medication,
  ReportSideEffect,
  // Helper functions
  getSideEffectReportsForMedication,
  getReportsByUser,
  getPatientMedicalHistory,
  getMedicationsWithSideEffectStats,
  getDoctorsBySpecialization,
  getMedicationsWithHighSeveritySideEffects
};