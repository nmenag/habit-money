import { Ionicons } from '@expo/vector-icons';
import { differenceInMonths, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Button,
  Card,
  Divider,
  ProgressBar,
  Text,
  Portal,
  Dialog,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { useStore, useTranslation } from '../../../store/useStore';
import { getValidGoalIcon } from '../../../constants';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

export const GoalDetailScreen = () => {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const goalId = params.goalId;
  const { goals, formatCurrency, deleteGoal, contributeToGoal, currency } =
    useStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState('');

  const goal = goals.find((g) => g.id === goalId);

  // Math insights memoized
  const calculations = useMemo(() => {
    if (!goal) return null;
    const progress = Math.min(
      (goal.currentAmount / goal.targetAmount) * 100,
      100,
    );
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

    let monthlyEstimate = 0;
    let monthsRemaining = 0;
    if (goal.deadline && remaining > 0) {
      const deadlineDate = parseISO(goal.deadline);
      const months = differenceInMonths(deadlineDate, new Date());
      monthsRemaining = Math.max(months, 0);
      if (months > 0) {
        monthlyEstimate = remaining / months;
      } else {
        monthlyEstimate = remaining;
      }
    }

    // Dynamic gamified tip: saved months by contributing $30/mo extra
    let monthsSavedWithExtra = 0;
    const extraContribution = 30;
    if (monthlyEstimate > 0 && monthsRemaining > 0) {
      const fasterMonthly = monthlyEstimate + extraContribution;
      const fasterMonths = remaining / fasterMonthly;
      monthsSavedWithExtra = Math.max(
        0,
        Math.round(monthsRemaining - fasterMonths * 10) / 10,
      );
    }

    const isCompleted = goal.currentAmount >= goal.targetAmount;

    return {
      progress,
      remaining,
      monthlyEstimate,
      monthsRemaining,
      monthsSavedWithExtra,
      isCompleted,
    };
  }, [goal]);

  if (!goal || !calculations) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>
          {t('goalNotFound')}
        </Text>
      </View>
    );
  }

  const {
    progress,
    remaining,
    monthlyEstimate,
    monthsSavedWithExtra,
    isCompleted,
  } = calculations;

  const handleDelete = () => {
    Alert.alert(
      t('confirmDelete') || 'Confirm Delete',
      t('confirmDeleteGoal') || 'Are you sure you want to delete this goal?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteGoal(goal.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleAddFunds = () => {
    const val = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(val) || val <= 0) return;

    contributeToGoal(goal.id, val);
    setAmount('');
    setVisible(false);
  };

  const goalColor = goal.color || theme.colors.primary;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <Card style={styles.headerCard} mode="contained">
            <View style={styles.headerContent}>
              <View
                style={[
                  styles.iconCircleLarge,
                  {
                    backgroundColor: `${goalColor}12`,
                    borderColor: `${goalColor}2B`,
                  },
                ]}
              >
                <Ionicons
                  name={getValidGoalIcon(goal.icon) as any}
                  size={32}
                  color={goalColor}
                />
              </View>

              <Text style={styles.goalTitle}>{goal.name}</Text>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isCompleted
                      ? theme.colors.incomeContainer
                      : theme.colors.outlineVariant,
                    borderColor: isCompleted
                      ? `${theme.colors.income}2B`
                      : theme.colors.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isCompleted
                        ? theme.colors.income
                        : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {isCompleted
                    ? t('goalReached') || 'Milestone Achieved'
                    : t('activeGoal') || 'Active Goal'}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {isCompleted && (
          <Animated.View entering={FadeInUp.delay(100).duration(300)}>
            <View style={styles.celebrationCard}>
              <Ionicons
                name="trophy-outline"
                size={24}
                color="#10B981"
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.celebrationTitle}>
                  {t('targetReachedBannerTitle')}
                </Text>
                <Text style={styles.celebrationDesc}>
                  {t('targetReachedBannerDesc', {
                    amount: formatCurrency(goal.targetAmount),
                  })}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(150).duration(300)}>
          <Card style={styles.statsCard} mode="contained">
            <Card.Content>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{t('progress')}</Text>
                <Text
                  style={[
                    styles.progressValue,
                    { color: isCompleted ? '#10B981' : goalColor },
                  ]}
                >
                  {Math.round(progress)}%
                </Text>
              </View>
              <ProgressBar
                progress={progress / 100}
                color={isCompleted ? '#10B981' : goalColor}
                style={styles.progressBar}
              />

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('currentAmount')}</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(goal.currentAmount)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t('targetAmount')}</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(goal.targetAmount)}
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.formulaSection}>
                <View style={styles.formulaRow}>
                  <View style={styles.formulaInfo}>
                    <Text style={styles.formulaLabel}>
                      {t('remainingAmount')}
                    </Text>
                    <Text style={styles.formulaDescription}>
                      {t('targetMinusSavedCapital')}
                    </Text>
                  </View>
                  <Text style={styles.formulaValue}>
                    {formatCurrency(remaining)}
                  </Text>
                </View>

                {goal.deadline && remaining > 0 ? (
                  <View style={[styles.formulaRow, styles.monthlyRow]}>
                    <View style={styles.formulaInfo}>
                      <Text style={styles.formulaLabel}>
                        {t('monthlySavingNeeded')}
                      </Text>
                      <Text style={styles.formulaDescription}>
                        {t('toReachDeadlineBy', {
                          date: new Date(goal.deadline).toLocaleDateString(),
                        })}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.formulaValue,
                        {
                          color: theme.colors.primary,
                          fontSize: fontScale(16),
                        },
                      ]}
                    >
                      {formatCurrency(monthlyEstimate)}
                    </Text>
                  </View>
                ) : remaining > 0 ? (
                  <View style={styles.hintContainer}>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color={theme.colors.outline}
                    />
                    <Text
                      style={[
                        styles.hintText,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('noDeadlineHint') ||
                        'Define a deadline goal post to unlock automatic monthly estimates.'}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {!isCompleted && remaining > 0 && monthsSavedWithExtra > 0 && (
          <Animated.View entering={FadeInUp.delay(200).duration(300)}>
            <View style={styles.savingTipsBox}>
              <Ionicons
                name="sparkles-outline"
                size={18}
                color={theme.colors.primary}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <Text style={styles.savingTipsText}>
                {t('saveFasterTip', {
                  extra: formatCurrency(30),
                  goalName: goal.name,
                  months: monthsSavedWithExtra,
                })}
              </Text>
            </View>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInUp.delay(250).duration(300)}
          style={styles.actions}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.mainActionButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setVisible(true)}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.mainActionText}>
              {t('addFunds') || 'Add Funds'}
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.secondaryButton,
                { borderColor: theme.colors.outlineVariant },
              ]}
              onPress={() =>
                router.push({
                  pathname: '/add-goal',
                  params: { goal: JSON.stringify(goal) },
                })
              }
            >
              <Ionicons
                name="pencil-outline"
                size={14}
                color={theme.colors.onSurface}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.secondaryActionText}>{t('edit')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.secondaryButton,
                { borderColor: theme.colors.outlineVariant },
              ]}
              onPress={handleDelete}
            >
              <Ionicons
                name="trash-outline"
                size={14}
                color={theme.colors.error}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.secondaryActionText,
                  { color: theme.colors.error },
                ]}
              >
                {t('delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={visible}
          onDismiss={() => setVisible(false)}
          style={[
            styles.dialog,
            { backgroundColor: theme.colors.elevation.level3 },
          ]}
        >
          <Dialog.Title
            style={{
              fontFamily: 'Inter-Medium',
              fontWeight: '500',
              fontSize: fontScale(18),
            }}
          >
            {t('addFunds') || 'Add Funds'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('amount')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              mode="outlined"
              autoFocus
              outlineStyle={{
                borderRadius: 10,
                borderColor: theme.colors.outlineVariant,
              }}
              style={{ backgroundColor: 'transparent' }}
              left={<TextInput.Affix text={currency + ' '} />}
            />
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Button
              onPress={() => setVisible(false)}
              textColor={theme.colors.onSurfaceVariant}
              style={{ borderRadius: 8 }}
            >
              {t('cancel')}
            </Button>
            <Button
              onPress={handleAddFunds}
              mode="contained"
              buttonColor={theme.colors.primary}
              textColor="#fff"
              style={{ borderRadius: 8, paddingHorizontal: 12 }}
            >
              {t('add')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <BannerAdComponent />
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerCard: {
      margin: 16,
      marginTop: 20,
      paddingVertical: 24,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    headerContent: {
      alignItems: 'center',
    },
    iconCircleLarge: {
      width: 64,
      height: 64,
      borderRadius: 18,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    goalTitle: {
      fontSize: fontScale(20),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      textAlign: 'center',
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 100,
      borderWidth: 0.5,
    },
    statusText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    celebrationCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#10B9812B',
      backgroundColor: theme.dark ? '#052E16' : '#DCFCE7',
      borderRadius: theme.roundness || 12,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    celebrationTitle: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      color: theme.dark ? '#A7F3D0' : '#065F46',
      marginBottom: 4,
    },
    celebrationDesc: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      lineHeight: 16,
      color: theme.dark ? '#34D399' : '#047857',
    },
    statsCard: {
      marginHorizontal: 16,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    progressValue: {
      fontSize: fontScale(18),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      marginBottom: 20,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    detailValue: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: 14,
    },
    formulaSection: {
      marginTop: 4,
    },
    formulaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    monthlyRow: {
      marginTop: 6,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    formulaInfo: {
      flex: 1,
    },
    formulaLabel: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    formulaDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    formulaValue: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    hintContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      padding: 10,
      backgroundColor: 'rgba(0,0,0,0.01)',
      borderRadius: 10,
    },
    hintText: {
      marginLeft: 8,
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
    },
    savingTipsBox: {
      marginHorizontal: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.roundness || 12,
      backgroundColor: theme.colors.surface,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    savingTipsText: {
      flex: 1,
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      lineHeight: 16,
      color: theme.colors.onSurface,
    },
    actions: {
      paddingHorizontal: 16,
      marginTop: 24,
    },
    mainActionButton: {
      height: 48,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    mainActionText: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: '#fff',
    },
    secondaryActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    secondaryButton: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryActionText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    dialog: {
      borderRadius: 16,
    },
  });
