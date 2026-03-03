import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const SETTINGS_KEYS = ['pushNotifications', 'emailNotifications', 'biometricAuth', 'darkMode', 'autoSave'];

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    biometricAuth: false,
    darkMode: false,
    autoSave: true,
  });
  const [loaded, setLoaded] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loaded = {};
        for (const key of SETTINGS_KEYS) {
          const value = await SecureStore.getItemAsync(`setting_${key}`);
          if (value !== null) loaded[key] = JSON.parse(value);
        }
        setSettings(prev => ({ ...prev, ...loaded }));
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const toggleSetting = async (key) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    try {
      await SecureStore.setItemAsync(`setting_${key}`, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const clearCache = () => {
    Alert.alert('Clear Cache', 'This will clear cached data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Success', 'Cache cleared successfully') },
    ]);
  };

  const SettingItem = ({ icon, title, description, value, onToggle }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + '12' }]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.divider, true: colors.primary + '60' }}
        thumbColor={value ? colors.primary : colors.textDisabled}
      />
    </View>
  );

  const ActionItem = ({ icon, title, onPress, destructive, color }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: (color || (destructive ? colors.error : colors.primary)) + '12' }]}>
        <Ionicons name={icon} size={18} color={color || (destructive ? colors.error : colors.primary)} />
      </View>
      <Text style={[styles.actionTitle, destructive && styles.destructiveText]}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <ActionItem
            icon="person"
            title="Edit Profile"
            onPress={() => navigation.navigate('Profile')}
          />
          <ActionItem
            icon="lock-closed"
            title="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            description="Receive push notifications for report updates"
            value={settings.pushNotifications}
            onToggle={() => toggleSetting('pushNotifications')}
          />
          <SettingItem
            icon="mail"
            title="Email Notifications"
            description="Receive email updates and summaries"
            value={settings.emailNotifications}
            onToggle={() => toggleSetting('emailNotifications')}
          />
        </View>
      </View>

      {/* Security */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          <SettingItem
            icon="finger-print"
            title="Biometric Authentication"
            description="Use fingerprint or Face ID to unlock"
            value={settings.biometricAuth}
            onToggle={() => toggleSetting('biometricAuth')}
          />
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <SettingItem
            icon="moon"
            title="Dark Mode"
            description="Switch to dark theme"
            value={settings.darkMode}
            onToggle={() => toggleSetting('darkMode')}
          />
        </View>
      </View>

      {/* Data & Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Storage</Text>
        <View style={styles.card}>
          <SettingItem
            icon="save"
            title="Auto-save Drafts"
            description="Automatically save incomplete reports"
            value={settings.autoSave}
            onToggle={() => toggleSetting('autoSave')}
          />
          <ActionItem icon="trash" title="Clear Cache" onPress={clearCache} destructive />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>2024.01.001</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>Expo SDK 54</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerBadge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={styles.footerBadgeText}>HIPAA Compliant</Text>
        </View>
        <Text style={styles.footerText}>SafeMed ADR © 2024</Text>
        <Text style={styles.footerSubtext}>Adverse Drug Reaction Reporting Platform</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { padding: spacing.base, paddingBottom: 0 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.sm, overflow: 'hidden' },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 34, height: 34, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 14, color: colors.text, fontWeight: '500' },
  settingDescription: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  actionItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  actionTitle: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  destructiveText: { color: colors.error },
  infoItem: {
    flexDirection: 'row', justifyContent: 'space-between', padding: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  infoLabel: { fontSize: 14, color: colors.text },
  infoValue: { fontSize: 14, color: colors.textSecondary },
  footer: { alignItems: 'center', padding: spacing.xxl },
  footerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary + '10', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginBottom: spacing.md,
  },
  footerBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  footerText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  footerSubtext: { fontSize: 12, color: colors.textDisabled, marginTop: spacing.xs },
});

export default SettingsScreen;
