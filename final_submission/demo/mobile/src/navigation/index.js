// Navigation exports
export { default as RootNavigator } from './RootNavigator';
export { default as AuthNavigator } from './AuthNavigator';
export { default as MainNavigator } from './MainNavigator';

// Screen names for navigation
export const SCREENS = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Patient
  HOME: 'Home',
  NEW_REPORT: 'NewReport',
  REPORTS_LIST: 'ReportsList',
  REPORT_DETAIL: 'ReportDetail',
  
  // Doctor
  DASHBOARD: 'Dashboard',
  MEDICATIONS_LIST: 'MedicationsList',
  ADD_MEDICATION: 'AddMedication',
  REVIEW_REQUESTS: 'ReviewRequests',
  
  // Common
  PROFILE: 'ProfileScreen',
  SETTINGS: 'Settings',
};
