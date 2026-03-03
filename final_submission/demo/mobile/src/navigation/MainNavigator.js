import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// Context
import { useAuth } from '../context/AuthContext';

// Patient Screens
import HomeScreen from '../screens/patient/HomeScreen';
import ReportScreen from '../screens/patient/ReportScreen';
import ReportsListScreen from '../screens/patient/ReportsListScreen';
import ReportDetailScreen from '../screens/patient/ReportDetailScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import ChangePasswordScreen from '../screens/common/ChangePasswordScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';

// Doctor Screens
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import MedicationsScreen from '../screens/doctor/MedicationsScreen';
import AddMedicationScreen from '../screens/doctor/AddMedicationScreen';
import ReviewRequestsScreen from '../screens/doctor/ReviewRequestsScreen';

// Services
import { notificationService } from '../services';

// Theme
import { colors } from '../config/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

// Patient Home Stack
const PatientHomeStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'SafeMed' }} />
    <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report Details' }} />
  </Stack.Navigator>
);

// Patient Reports Stack
const PatientReportsStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="ReportsList" component={ReportsListScreen} options={{ title: 'My Reports' }} />
    <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report Details' }} />
  </Stack.Navigator>
);

// Report Submission Stack
const ReportStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="NewReport" component={ReportScreen} options={{ title: 'Report Side Effect' }} />
  </Stack.Navigator>
);

// Profile Stack — includes Settings and ChangePassword
const ProfileStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
  </Stack.Navigator>
);

// Notifications Stack
const NotificationsStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="NotificationsList" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report Details' }} />
  </Stack.Navigator>
);

// Doctor Home Stack
const DoctorHomeStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="DoctorHomeScreen" component={DoctorHomeScreen} options={{ title: 'Dashboard' }} />
    <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report Details' }} />
  </Stack.Navigator>
);

// Medications Stack
const MedicationsStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="MedicationsList" component={MedicationsScreen} options={{ title: 'Medications' }} />
    <Stack.Screen name="AddMedication" component={AddMedicationScreen} options={{ title: 'Add Medication' }} />
  </Stack.Navigator>
);

// Review Stack
const ReviewStack = () => (
  <Stack.Navigator screenOptions={headerOptions}>
    <Stack.Screen name="ReviewRequests" component={ReviewRequestsScreen} options={{ title: 'Review Requests' }} />
    <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report Details' }} />
  </Stack.Navigator>
);

// Badge component for tab icons
const TabBarIconWithBadge = ({ iconName, color, size, badgeCount }) => (
  <View style={{ width: 28, height: 28 }}>
    <Ionicons name={iconName} size={size} color={color} />
    {badgeCount > 0 && (
      <View style={badgeStyles.badge}>
        <Text style={badgeStyles.badgeText}>
          {badgeCount > 99 ? '99+' : badgeCount}
        </Text>
      </View>
    )}
  </View>
);

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

// Hook to fetch unread notification count
const useUnreadCount = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationService.getNotifications({ limit: 1 });
        // Try unreadCount from API, or count locally
        if (res.data?.unreadCount !== undefined) {
          setCount(res.data.unreadCount);
        }
      } catch (e) {
        // silent
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);
  return count;
};

// Patient Tab Navigator
const PatientTabNavigator = () => {
  const unreadCount = useUnreadCount();
  return (
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
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              return (
                <TabBarIconWithBadge
                  iconName={iconName}
                  color={color}
                  size={size}
                  badgeCount={unreadCount}
                />
              );
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
      <Tab.Screen name="Report" component={ReportStack} options={{ tabBarLabel: 'New Report' }} />
      <Tab.Screen name="Reports" component={PatientReportsStack} options={{ tabBarLabel: 'My Reports' }} />
      <Tab.Screen name="Notifications" component={NotificationsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

// Doctor Tab Navigator
const DoctorTabNavigator = () => {
  const unreadCount = useUnreadCount();
  return (
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
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              return (
                <TabBarIconWithBadge
                  iconName={iconName}
                  color={color}
                  size={size}
                  badgeCount={unreadCount}
                />
              );
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
      <Tab.Screen name="Notifications" component={NotificationsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

// Main Navigator - switches based on user role
const MainNavigator = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';
  return isDoctor ? <DoctorTabNavigator /> : <PatientTabNavigator />;
};

export default MainNavigator;
