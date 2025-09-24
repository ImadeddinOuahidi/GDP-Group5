// Model relationships and usage examples

const User = require('./User');
const Medicine = require('./Medicine');
const ReportSideEffect = require('./ReportSideEffect');

/**
 * Model Relationships:
 * 
 * 1. User -> Medicine (One-to-Many)
 *    - A user (doctor/admin) can create/manage multiple medicines
 *    - Medicine.createdBy references User._id
 * 
 * 2. User -> ReportSideEffect (One-to-Many)
 *    - A user can report multiple side effects
 *    - ReportSideEffect.reportedBy references User._id
 * 
 * 3. User -> ReportSideEffect (One-to-Many for patients)
 *    - A patient can have multiple side effect reports
 *    - ReportSideEffect.patient references User._id
 * 
 * 4. Medicine -> ReportSideEffect (One-to-Many)
 *    - A medicine can have multiple side effect reports
 *    - ReportSideEffect.medicine references Medicine._id
 */

// Example usage patterns:

// 1. Get all medicines created by a doctor
async function getMedicinesByDoctor(doctorId) {
  return await Medicine.find({ createdBy: doctorId, isActive: true })
    .populate('createdBy', 'firstName lastName');
}

// 2. Get all side effect reports for a specific medicine
async function getSideEffectReportsForMedicine(medicineId) {
  return await ReportSideEffect.findByMedicine(medicineId);
}

// 3. Get all reports submitted by a user
async function getReportsByUser(userId) {
  return await ReportSideEffect.find({ reportedBy: userId })
    .populate('medicine', 'name genericName')
    .populate('patient', 'firstName lastName');
}

// 4. Get patient's medical history including reported side effects
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

// 5. Get medicines in a specific category with their side effect statistics
async function getMedicinesWithSideEffectStats(category) {
  const medicines = await Medicine.find({ category, isActive: true });
  
  const medicinesWithStats = await Promise.all(medicines.map(async (medicine) => {
    const reports = await ReportSideEffect.find({ medicine: medicine._id });
    const seriousReports = reports.filter(r => r.reportDetails.seriousness === 'Serious');
    
    return {
      ...medicine.toObject(),
      sideEffectStats: {
        totalReports: reports.length,
        seriousReports: seriousReports.length,
        mostCommonSideEffects: getMostCommonSideEffects(reports)
      }
    };
  }));
  
  return medicinesWithStats;
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

// 6. Find doctors specializing in specific conditions with their prescribed medicines
async function getDoctorsBySpecialization(specialization) {
  const doctors = await User.find({ 
    role: 'doctor',
    'doctorInfo.specialization': specialization,
    isActive: true
  }).populate('prescribedMedicines');
  
  return doctors;
}

// 7. Advanced query: Find medicines with high-severity side effects
async function getMedicinesWithHighSeveritySideEffects() {
  const highSeverityReports = await ReportSideEffect.find({
    'sideEffects.severity': { $in: ['Severe', 'Life-threatening'] },
    'reportDetails.seriousness': 'Serious'
  }).populate('medicine');
  
  const medicineIds = [...new Set(highSeverityReports.map(r => r.medicine._id))];
  return await Medicine.find({ _id: { $in: medicineIds } });
}

module.exports = {
  User,
  Medicine,
  ReportSideEffect,
  // Helper functions
  getMedicinesByDoctor,
  getSideEffectReportsForMedicine,
  getReportsByUser,
  getPatientMedicalHistory,
  getMedicinesWithSideEffectStats,
  getDoctorsBySpecialization,
  getMedicinesWithHighSeveritySideEffects
};