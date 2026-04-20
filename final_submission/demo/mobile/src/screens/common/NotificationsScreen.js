import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';
import { useI18n } from '../../context/I18nContext';

const NotificationsScreen = ({ navigation }) => {
  const { t, locale } = useI18n();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      if (response.data) {
        setNotifications(
          Array.isArray(response.data) ? response.data : response.data.notifications || []
        );
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      Alert.alert(t('common.error'), t('notifications.markAllReadFailed'));
    }
  };

  const getLocalizedNotification = (item = {}) => {
    const args = item.metadata?.notificationArgs || {};
    const keyMap = {
      urgent_report: {
        title: 'notifications.types.urgentReport',
        message: 'notifications.messages.urgentReport',
      },
      critical_report: {
        title: 'notifications.types.criticalReport',
        message: 'notifications.messages.criticalReport',
      },
      status_updated: {
        title: 'notifications.types.statusUpdated',
        message: 'notifications.messages.statusUpdated',
      },
      ai_analysis_complete: {
        title: 'notifications.types.aiAnalysisComplete',
        message: 'notifications.messages.aiAnalysisComplete',
      },
      review_completed: {
        title: 'notifications.types.reviewCompleted',
        message: 'notifications.messages.reviewCompleted',
      },
    };

    const keys = keyMap[item.type] || {};
    return {
      title: keys.title ? t(keys.title, args) : (item.title || t('notifications.title')),
      message: keys.message ? t(keys.message, args) : (item.message || ''),
    };
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'report_submitted':
      case 'new_report':
        return { name: 'document-text', color: colors.primary };
      case 'report_reviewed':
      case 'review_completed':
        return { name: 'checkmark-circle', color: colors.success };
      case 'report_status_changed':
      case 'status_updated':
        return { name: 'swap-horizontal', color: colors.info };
      case 'medication_alert':
        return { name: 'medkit', color: colors.warning };
      case 'severe_case':
      case 'urgent_report':
      case 'critical_report':
        return { name: 'alert-circle', color: colors.error };
      case 'review_requested':
        return { name: 'clipboard', color: colors.warning };
      case 'ai_analysis_complete':
        return { name: 'analytics', color: '#7C4DFF' };
      case 'duplicate_detected':
        return { name: 'copy', color: colors.info };
      default:
        return { name: 'notifications', color: colors.primary };
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.justNow');
    if (diffMins < 60) return t('notifications.time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notifications.time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notifications.time.daysAgo', { count: diffDays });
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderNotificationItem = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    const localized = getLocalizedNotification(item);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => {
          if (!item.isRead) handleMarkAsRead(item._id);
          // relatedReport can be populated object {_id, status, priority} or plain ObjectId string
          const reportId =
            (typeof item.relatedReport === 'object' ? item.relatedReport?._id : item.relatedReport) ||
            item.metadata?.reportId ||
            item.data?.reportId;
          if (reportId) {
            navigation.navigate('ReportDetail', { reportId });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>
            {localized.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {localized.message}
          </Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      {notifications.length > 0 && unreadCount > 0 && (
        <View style={styles.headerActions}>
          <Text style={styles.unreadLabel}>
            {t('notifications.unreadCount', { count: unreadCount })}
          </Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('notifications.emptyText')}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  unreadLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  markAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  unreadCard: {
    backgroundColor: colors.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.textDisabled,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});

export default NotificationsScreen;
