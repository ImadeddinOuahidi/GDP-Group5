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
import { useI18n } from '../../context/I18nContext';

const SETTINGS_KEYS = ['pushNotifications', 'emailNotifications', 'biometricAuth', 'darkMode', 'autoSave'];

const SettingsScreen = ({ navigation }) => {
  const { t, locale, changeLanguage, supportedLanguages } = useI18n();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    biometricAuth: false,
    darkMode: false,
    autoSave: true,
  });

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
    Alert.alert(t('settings.messages.clearCacheTitle'), t('settings.messages.clearCacheDescription'), [
      { text: t('settings.messages.cancel'), style: 'cancel' },
      { text: t('settings.messages.clear'), style: 'destructive', onPress: () => Alert.alert(t('settings.messages.clearCacheTitle'), t('settings.messages.cacheCleared')) },
    ]);
  };

  const handleChangeLanguage = async (langCode) => {
    if (langCode === locale) return;

    const success = await changeLanguage(langCode);
    if (success) {
      Alert.alert(t('settings.sections.language'), t('settings.messages.languageUpdated'));
    }
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

  const LanguageItem = ({ code, label }) => {
    const isActive = locale === code;

    return (
      <TouchableOpacity style={styles.languageItem} onPress={() => handleChangeLanguage(code)}>
        <Text style={[styles.languageLabel, isActive && styles.languageLabelActive]}>{label}</Text>
        {isActive && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.profile')}</Text>
        <View style={styles.card}>
          <ActionItem
            icon="person"
            title={t('settings.actions.editProfile')}
            onPress={() => navigation.navigate('Profile')}
          />
          <ActionItem
            icon="lock-closed"
            title={t('settings.actions.changePassword')}
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>
      </View>

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.language')}</Text>
        <View style={styles.card}>
          {supportedLanguages.map((language) => (
            <LanguageItem key={language.code} code={language.code} label={language.label} />
          ))}
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.notifications')}</Text>
        <View style={styles.card}>
          <SettingItem
            icon="notifications"
            title={t('settings.toggles.pushTitle')}
            description={t('settings.toggles.pushDescription')}
            value={settings.pushNotifications}
            onToggle={() => toggleSetting('pushNotifications')}
          />
          <SettingItem
            icon="mail"
            title={t('settings.toggles.emailTitle')}
            description={t('settings.toggles.emailDescription')}
            value={settings.emailNotifications}
            onToggle={() => toggleSetting('emailNotifications')}
          />
        </View>
      </View>

      {/* Security */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.security')}</Text>
        <View style={styles.card}>
          <SettingItem
            icon="finger-print"
            title={t('settings.toggles.biometricTitle')}
            description={t('settings.toggles.biometricDescription')}
            value={settings.biometricAuth}
            onToggle={() => toggleSetting('biometricAuth')}
          />
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.appearance')}</Text>
        <View style={styles.card}>
          <SettingItem
            icon="moon"
            title={t('settings.toggles.darkModeTitle')}
            description={t('settings.toggles.darkModeDescription')}
            value={settings.darkMode}
            onToggle={() => toggleSetting('darkMode')}
          />
        </View>
      </View>

      {/* Data & Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.dataStorage')}</Text>
        <View style={styles.card}>
          <SettingItem
            icon="save"
            title={t('settings.toggles.autoSaveTitle')}
            description={t('settings.toggles.autoSaveDescription')}
            value={settings.autoSave}
            onToggle={() => toggleSetting('autoSave')}
          />
          <ActionItem icon="trash" title={t('settings.actions.clearCache')} onPress={clearCache} destructive />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.sections.about')}</Text>
        <View style={styles.card}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('settings.about.version')}</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('settings.about.build')}</Text>
            <Text style={styles.infoValue}>2024.01.001</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('settings.about.platform')}</Text>
            <Text style={styles.infoValue}>Expo SDK 54</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerBadge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={styles.footerBadgeText}>{t('settings.about.hipaa')}</Text>
        </View>
        <Text style={styles.footerText}>{t('settings.about.appName')} © 2024</Text>
        <Text style={styles.footerSubtext}>{t('settings.about.appTagline')}</Text>
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
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  languageLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  languageLabelActive: {
    color: colors.primary,
  },
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
