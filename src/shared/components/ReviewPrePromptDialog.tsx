import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Modal, Portal, Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ReviewManager } from '../../services/ReviewManager';
import { useTranslation } from '../../store/useStore';
import { AppTheme, radius, spacing } from '../../theme/theme';
import { fontScale } from '../../utils/responsive';

interface ReviewPrePromptDialogProps {
  visible?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onDismiss?: () => void;
}

export const ReviewPrePromptDialog: React.FC<ReviewPrePromptDialogProps> = ({
  visible: propVisible,
  onAccept,
  onDecline,
  onDismiss,
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  const isControlled = propVisible !== undefined;
  const visible = isControlled ? propVisible : internalVisible;

  useEffect(() => {
    if (!isControlled) {
      const listener = (show: boolean) => {
        setInternalVisible(show);
      };
      ReviewManager.setOnPrePromptListener(listener);
      return () => {
        ReviewManager.setOnPrePromptListener(null);
      };
    }
  }, [isControlled]);

  const handleYes = async (): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onAccept) {
      onAccept();
    } else {
      await ReviewManager.handleUserFeedback(true);
    }
  };

  const handleNotReally = async (): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onDecline) {
      onDecline();
    } else {
      await ReviewManager.handleUserFeedback(false);
    }
  };

  const handleDismiss = async (): Promise<void> => {
    if (onDismiss) {
      onDismiss();
    } else {
      await ReviewManager.handleUserDismiss();
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleDismiss}
            style={[
              styles.closeBtn,
              {
                backgroundColor: theme.dark ? '#1A2421' : '#F0F4F2',
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            accessibilityLabel={t('cancel') || 'Cancel'}
            accessibilityRole="button"
          >
            <Ionicons
              name="close"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: theme.dark
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(34, 197, 94, 0.1)',
                borderColor: 'rgba(34, 197, 94, 0.25)',
              },
            ]}
          >
            <Ionicons name="sparkles" size={28} color="#22C55E" />
          </View>

          <Text
            style={[styles.title, { color: theme.colors.onSurface }]}
            accessibilityRole="header"
          >
            {t('enjoyingAppTitle') || 'Enjoying Habit Money?'}
          </Text>

          <Text
            style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('enjoyingAppMessage') ||
              'Your feedback helps us make Habit Money even better for managing your finances.'}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleYes}
              accessibilityRole="button"
              accessibilityLabel={t('rateYes') || 'Yes! 👍'}
            >
              <Text style={styles.primaryBtnText}>
                {t('rateYes') || 'Yes! 👍'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: theme.dark ? '#1A2421' : '#F0F4F2',
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              onPress={handleNotReally}
              accessibilityRole="button"
              accessibilityLabel={t('rateNotReally') || 'Not really 👎'}
            >
              <Text
                style={[
                  styles.secondaryBtnText,
                  { color: theme.colors.onSurface },
                ]}
              >
                {t('rateNotReally') || 'Not really 👎'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    maxWidth: 420,
    width: '90%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    fontSize: fontScale(18),
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: fontScale(14),
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryBtn: {
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    fontSize: fontScale(15),
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    fontSize: fontScale(15),
  },
});
