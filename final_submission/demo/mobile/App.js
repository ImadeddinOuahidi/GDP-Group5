import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Context
import { AuthProvider } from './src/context/AuthContext';
import { I18nProvider } from './src/context/I18nContext';

// Theme
import { theme } from './src/config/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <NavigationContainer theme={theme}>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
