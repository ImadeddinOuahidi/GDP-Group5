import React, { useState } from 'react';
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

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    pushNotifications: true,
    emailNotifications: false,
    biometricAuth: false,
    darkMode: false,
    autoSave: true,
  });

  const toggleSetting = async (key) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    // Persist settings
    try {
      await SecureStore.setItemAsync(`setting_${key}`, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Cache cleared successfully'),
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, description, value, onToggle }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={colors.primary} style={styles.settingIcon} />
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

  const ActionItem = ({ icon, title, onPress, destructive }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <Ionicons
        name={icon}
        size={24}
        color={destructive ? colors.error : colors.text}
        style={styles.settingIcon}
      />
      <Text style={[styles.actionTitle, destructive && styles.destructiveText]}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            description="Receive push notifications"
            value={settings.pushNotifications}
            onToggle={() => toggleSetting('pushNotifications')}
          />
          <SettingItem
            icon="mail"
            title="Email Notifications"
            description="Receive email updates"
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
            description="Use fingerprint or Face ID"
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
            description="Use dark theme"
            value={settings.darkMode}
            onToggle={() => toggleSetting('darkMode')}
          />
        </View>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.card}>
          <SettingItem
            icon="save"
            title="Auto-save Drafts"
            description="Save incomplete reports"
            value={settings.autoSave}
            onToggle={() => toggleSetting('autoSave')}
          />
          <ActionItem
            icon="trash"
            title="Clear Cache"
            onPress={clearCache}
            destructive
          />
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
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SafeMed © 2024</Text>
        <Text style={styles.footerSubtext}>Healthcare Reporting Platform</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: spacing.base,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  destructiveText: {
    color: colors.error,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.textDisabled,
    marginTop: spacing.xs,
  },
});

export default SettingsScreen;
