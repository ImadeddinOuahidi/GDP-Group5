import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// Context
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

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
import AnalyticsScreen from '../screens/doctor/AnalyticsScreen';

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
const PatientHomeStack = () => {
  const { t } = useI18n();

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: t('nav.appTitle') }} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: t('nav.reportDetails') }} />
    </Stack.Navigator>
  );
};

// Patient Reports Stack
const PatientReportsStack = () => {
  const { t } = useI18n();

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="ReportsList" component={ReportsListScreen} options={{ title: t('nav.myReports') }} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: t('nav.reportDetails') }} />
    </Stack.Navigator>
  );
};

// Report Submission Stack
const ReportStack = () => {
  const { t } = useI18n();

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="NewReport" component={ReportScreen} options={{ title: t('nav.reportSideEffect') }} />
    </Stack.Navigator>
  );
};

// Profile Stack — includes Settings and ChangePassword
const ProfileStack = () => {
  const { t } = useI18n();

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: t('nav.profile') }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('nav.settings') }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: t('nav.changePassword') }} />
    </Stack.Navigator>
  );
};

// Notifications Stack
const NotificationsStack = () => {
  const { t } = useI18n();

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="NotificationsList" component={NotificationsScreen} options={{ title: t('nav.notifications') }} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: t('nav.reportDetails') }} />
    </Stack.Navigator>
  );
};

// Doctor Home Stack
const DoctorHomeStack = () => {
  const { t } = useI18n();
  const { isAdmin } = useAuth();

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="DoctorHomeScreen"
        component={DoctorHomeScreen}
        options={{ title: isAdmin ? t('nav.adminCommandCenter') : t('nav.dashboard') }}
      />
      <Stack.Screen name="StaffAnalytics" component={AnalyticsScreen} options={{ title: t('nav.dashboard') }} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: t('nav.reportDetails') }} />
    </Stack.Navigator>
  );
};

// Medications Stack
const MedicationsStack = () => {
  const { t } = useI18n();
  const { isAdmin } = useAuth();

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="MedicationsList"
        component={MedicationsScreen}
        options={{ title: isAdmin ? t('nav.adminMedicationCatalog') : t('nav.medications') }}
      />
      <Stack.Screen name="AddMedication" component={AddMedicationScreen} options={{ title: t('nav.addMedication') }} />
    </Stack.Navigator>
  );
};

// Review Stack
const ReviewStack = () => {
  const { t } = useI18n();
  const { isAdmin } = useAuth();

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="ReviewRequests"
        component={ReviewRequestsScreen}
        options={{ title: isAdmin ? t('nav.adminReviewQueue') : t('nav.reviewRequests') }}
      />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: t('nav.reportDetails') }} />
    </Stack.Navigator>
  );
};

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
  const { t } = useI18n();
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
      <Tab.Screen name="Home" component={PatientHomeStack} options={{ tabBarLabel: t('nav.tabs.home') }} />
      <Tab.Screen name="Report" component={ReportStack} options={{ tabBarLabel: t('nav.tabs.report') }} />
      <Tab.Screen name="Reports" component={PatientReportsStack} options={{ tabBarLabel: t('nav.tabs.reports') }} />
      <Tab.Screen name="Notifications" component={NotificationsStack} options={{ tabBarLabel: t('nav.tabs.notifications') }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: t('nav.tabs.profile') }} />
    </Tab.Navigator>
  );
};

// Doctor Tab Navigator
const DoctorTabNavigator = () => {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const unreadCount = useUnreadCount();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = isAdmin
                ? (focused ? 'shield-checkmark' : 'shield-checkmark-outline')
                : (focused ? 'grid' : 'grid-outline');
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
      <Tab.Screen
        name="Dashboard"
        component={DoctorHomeStack}
        options={{ tabBarLabel: isAdmin ? t('nav.tabs.adminDashboard') : t('nav.tabs.dashboard') }}
      />
      <Tab.Screen
        name="Medications"
        component={MedicationsStack}
        options={{ tabBarLabel: isAdmin ? t('nav.tabs.adminMedications') : t('nav.tabs.medications') }}
      />
      <Tab.Screen
        name="Review"
        component={ReviewStack}
        options={{ tabBarLabel: isAdmin ? t('nav.tabs.adminReview') : t('nav.tabs.review') }}
      />
      <Tab.Screen name="Notifications" component={NotificationsStack} options={{ tabBarLabel: t('nav.tabs.notifications') }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: t('nav.tabs.profile') }} />
    </Tab.Navigator>
  );
};

// Main Navigator - switches based on user role
const MainNavigator = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'doctor' || user?.role === 'admin';
  return isStaff ? <DoctorTabNavigator /> : <PatientTabNavigator />;
};

export default MainNavigator;
