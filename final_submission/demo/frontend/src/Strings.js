const Strings = {
  appName: 'SafeMed ADR',
  subtitle: 'Adverse Drug Reaction Reporting System',

  // Auth / Login
  demoCredentialsTitle: 'Demo Credentials:',
  emailOrUsername: 'Email or Username',
  emailOrUsernameHelper: 'Enter your email address or username',
  password: 'Password',
  togglePasswordVisibilityAria: 'toggle password visibility',
  signingIn: 'Signing In...',
  signIn: 'Sign In',
  newToApp: 'New to SafeMed ADR?',
  createAccount: 'Create Account',
  footerCopyright: 'SafeMed ADR © 2025 - Secure Medical Reporting',

  // Home / Dashboard
  welcomeBack: (name = 'Patient') => `Welcome back, ${name}!`,
  doctorWelcome: (name = 'Doctor') => `Welcome back, Dr. ${name}`,
  doctorPortalTitle: 'Doctor Portal',
  monitorADRText: 'Monitor adverse drug reactions and ensure patient safety',
  createNewADRTooltip: 'Create New ADR Report',
  newReportLabel: 'New Report',
  patientPortalTag: 'Patient Portal',
  profileCompletion: 'Profile Completion',
  completeProfileHint: 'Complete your profile for better reporting',
  quickActionsTitle: 'Quick Actions',
  recentActivityTitle: 'Recent Activity',
  viewAllReports: 'View All Reports',
  whyChooseTitle: 'Why Choose SafeMed ADR?',

  // Features / actions
  quickReportingTitle: 'Quick Reporting',
  quickReportingDesc: "Report side effects in minutes with our intuitive interface",
  securePrivateTitle: 'Secure & Private',
  securePrivateDesc: 'Your medical data is encrypted and protected',
  realtimeAnalysisTitle: 'Real-time Analysis',
  realtimeAnalysisDesc: 'Doctors get instant alerts for urgent cases',
  reportSideEffect: 'Report Side Effect',
  viewMyReports: 'View My Reports',
  settings: 'Settings',

  // Status labels
  priority: 'Priority',
  reviewed: 'Reviewed',
  pending: 'Pending',

  // Emergency Notice
  emergencyNoticeTitle: 'Emergency Notice',
  emergencyNoticeText: "Important: If you're experiencing a medical emergency, call emergency services immediately (911). This system is designed for reporting non-emergency adverse drug reactions only.",
  call911: 'Call 911',
};

export default Strings;
