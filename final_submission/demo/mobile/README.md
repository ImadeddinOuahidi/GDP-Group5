# SafeMed Mobile App

A cross-platform React Native mobile application for SafeMed - a healthcare side effect reporting platform.

## Features

- **Patient Features**
  - Report medication side effects with AI-powered severity detection
  - View report history and status
  - Profile management

- **Doctor Features**
  - Dashboard with analytics
  - Review patient reports
  - Manage medications database
  - Add new medications

- **Shared Features**
  - Secure authentication (JWT)
  - Role-based navigation
  - Push notifications (configurable)
  - Biometric authentication support
  - Dark mode support

## Tech Stack

- **Framework**: React Native with Expo SDK 50
- **Navigation**: React Navigation 6.x
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Storage**: Expo SecureStore (encrypted)
- **UI Icons**: @expo/vector-icons (Ionicons)

## Project Structure

```
mobile/
├── App.js                     # Root component
├── app.json                   # Expo configuration
├── babel.config.js            # Babel setup
├── package.json               # Dependencies
└── src/
    ├── config/
    │   ├── constants.js       # API config, app constants
    │   └── theme.js           # Colors, typography, spacing
    ├── context/
    │   └── AuthContext.js     # Authentication state
    ├── navigation/
    │   ├── AuthNavigator.js   # Login/Register flow
    │   ├── MainNavigator.js   # Authenticated screens
    │   └── RootNavigator.js   # Auth state routing
    ├── screens/
    │   ├── auth/              # Authentication screens
    │   │   ├── LoginScreen.js
    │   │   ├── RegisterScreen.js
    │   │   └── ForgotPasswordScreen.js
    │   ├── patient/           # Patient-specific screens
    │   │   ├── HomeScreen.js
    │   │   ├── ReportScreen.js
    │   │   ├── ReportsListScreen.js
    │   │   └── ReportDetailScreen.js
    │   ├── doctor/            # Doctor-specific screens
    │   │   ├── DoctorHomeScreen.js
    │   │   ├── MedicationsScreen.js
    │   │   ├── AddMedicationScreen.js
    │   │   └── ReviewRequestsScreen.js
    │   └── common/            # Shared screens
    │       ├── ProfileScreen.js
    │       └── SettingsScreen.js
    └── services/
        ├── apiClient.js       # Axios instance
        ├── authService.js     # Auth API calls
        ├── reportService.js   # Reports API calls
        └── medicationService.js # Medications API calls
```

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for physical device testing)

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd final_submission/demo/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API URL in `src/config/constants.js`:
   ```javascript
   BASE_URL: 'http://your-backend-url:5001/api'
   ```
   
   For local development with a physical device, use your machine's IP address instead of `localhost`.

### Running the App

```bash
# Start Expo development server
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Clear cache and restart
npx expo start -c
```

### Development

- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Press `r` to reload the app
- Press `j` to open debugger
- Scan QR code with Expo Go app for physical device

## API Integration

The app connects to the SafeMed backend API. Ensure the backend is running:

```bash
cd ../backend
npm install
npm run dev
```

### Environment Variables

For production builds, update the `API_CONFIG.BASE_URL` in constants.js or use environment variables with Expo's `app.config.js`.

## Building for Production

### iOS (requires macOS and Xcode)

```bash
# Build for iOS
npx expo build:ios

# Or use EAS Build
eas build --platform ios
```

### Android

```bash
# Build APK
npx expo build:android -t apk

# Build AAB for Play Store
npx expo build:android -t app-bundle

# Or use EAS Build
eas build --platform android
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## License

This project is part of the SafeMed healthcare platform.
