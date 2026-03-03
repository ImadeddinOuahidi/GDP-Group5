import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Context
import { useAuth } from '../context/AuthContext';

// Patient Screens
import HomeScreen from '../screens/patient/HomeScreen';
import ReportScreen from '../screens/patient/ReportScreen';
import ReportsListScreen from '../screens/patient/ReportsListScreen';
import ReportDetailScreen from '../screens/patient/ReportDetailScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import SettingsScreen from '../screens/common/SettingsScreen';

// Doctor Screens
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import MedicationsScreen from '../screens/doctor/MedicationsScreen';
import AddMedicationScreen from '../screens/doctor/AddMedicationScreen';
import ReviewRequestsScreen from '../screens/doctor/ReviewRequestsScreen';

// Theme
import { colors } from '../config/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Patient Home Stack
const PatientHomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="HomeScreen" 
      component={HomeScreen} 
      options={{ title: 'SafeMed' }}
    />
    <Stack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen}
      options={{ title: 'Report Details' }}
    />
  </Stack.Navigator>
);

// Patient Reports Stack
const PatientReportsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="ReportsList" 
      component={ReportsListScreen}
      options={{ title: 'My Reports' }}
    />
    <Stack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen}
      options={{ title: 'Report Details' }}
    />
  </Stack.Navigator>
);

// Report Submission Stack
const ReportStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="NewReport" 
      component={ReportScreen}
      options={{ title: 'Report Side Effect' }}
    />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="ProfileScreen" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

// Doctor Home Stack
const DoctorHomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="DoctorHomeScreen" 
      component={DoctorHomeScreen}
      options={{ title: 'Dashboard' }}
    />
    <Stack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen}
      options={{ title: 'Report Details' }}
    />
  </Stack.Navigator>
);

// Medications Stack
const MedicationsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="MedicationsList" 
      component={MedicationsScreen}
      options={{ title: 'Medications' }}
    />
    <Stack.Screen 
      name="AddMedication" 
      component={AddMedicationScreen}
      options={{ title: 'Add Medication' }}
    />
  </Stack.Navigator>
);

// Review Stack
const ReviewStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="ReviewRequests" 
      component={ReviewRequestsScreen}
      options={{ title: 'Review Requests' }}
    />
    <Stack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen}
      options={{ title: 'Report Details' }}
    />
  </Stack.Navigator>
);

// Patient Tab Navigator
const PatientTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Report':
            iconName = focused ? 'add-circle' : 'add-circle-outline';
            break;
          case 'Reports':
            iconName = focused ? 'document-text' : 'document-text-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'ellipse';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
    })}
  >
    <Tab.Screen name="Home" component={PatientHomeStack} />
    <Tab.Screen 
      name="Report" 
      component={ReportStack}
      options={{ tabBarLabel: 'New Report' }}
    />
    <Tab.Screen 
      name="Reports" 
      component={PatientReportsStack}
      options={{ tabBarLabel: 'My Reports' }}
    />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Doctor Tab Navigator
const DoctorTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'grid' : 'grid-outline';
            break;
          case 'Medications':
            iconName = focused ? 'medkit' : 'medkit-outline';
            break;
          case 'Review':
            iconName = focused ? 'clipboard' : 'clipboard-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'ellipse';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DoctorHomeStack} />
    <Tab.Screen name="Medications" component={MedicationsStack} />
    <Tab.Screen name="Review" component={ReviewStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Main Navigator - switches based on user role
const MainNavigator = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

  return isDoctor ? <DoctorTabNavigator /> : <PatientTabNavigator />;
};

export default MainNavigator;
