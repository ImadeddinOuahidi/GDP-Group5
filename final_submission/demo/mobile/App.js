import React, { useState, useEffect, createContext, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Context
import { AuthProvider } from './src/context/AuthContext';

// Theme
import { theme } from './src/config/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={theme}>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
