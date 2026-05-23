import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Card, FAB, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { Goal, useStore, useTranslation } from '../../../store/useStore';
import { getValidGoalIcon } from '../../../constants';
import { AppTheme, spacing } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

export const GoalsScreen = () => {
  const goals = useStore((s) => s.goals);
  const formatCurrency = useStore((s) => s.formatCurrency);
  const updateGoalsOrder = useStore((s) => s.updateGoalsOrder);

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const { totalTarget, totalSaved, overallProgress, completedCount } =
    useMemo(() => {
      let targetSum = 0;
      let savedSum = 0;
      let completed = 0;

      goals.forEach((g) => {
        targetSum += g.targetAmount;
        savedSum += g.currentAmount;
        if (g.currentAmount >= g.targetAmount) {
          completed += 1;
        }
      });

      const progress = targetSum > 0 ? savedSum / targetSum : 0;
      return {
        totalTarget: targetSum,
        totalSaved: savedSum,
        overallProgress: Math.min(progress, 1),
        completedCount: completed,
      };
    }, [goals]);

  const smartAdvice = useMemo(() => {
    if (goals.length === 0) return null;
    const remaining = Math.max(totalTarget - totalSaved, 0);

    if (overallProgress >= 0.75) {
      return {
        text: t('smartAdviceClosingIn', {
          percent: Math.round(overallProgress * 100),
        }),
        color: theme.colors.primary,
        bgColor: theme.colors.incomeContainer,
      };
    } else if (remaining > 0) {
      return {
        text: t('smartAdviceFinancialTip'),
        color: '#D97706',
        bgColor: theme.dark ? '#332511' : '#FFF7E6',
      };
    } else {
      return {
        text: t('smartAdviceAchievedAll'),
        color: theme.colors.primary,
        bgColor: theme.colors.incomeContainer,
      };
    }
  }, [overallProgress, totalTarget, totalSaved, goals.length, theme, t]);

  const handleGoalPress = useCallback((id: string) => {
    router.push({
      pathname: '/goal-detail',
      params: { goalId: id },
    });
  }, []);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Goal>) => {
      const progressPercent =
        item.targetAmount > 0
          ? Math.min((item.currentAmount / item.targetAmount) * 100, 100)
          : 0;

      const isCompleted = item.currentAmount >= item.targetAmount;
      const goalColor = item.color || theme.colors.primary;

      const milestoneTag = (() => {
        if (progressPercent >= 100)
          return {
            label: t('reachedLabel'),
            color: '#10B981',
            bgColor: theme.dark ? '#052E16' : '#DCFCE7',
          };
        if (progressPercent >= 75)
          return {
            label: t('closingInLabel'),
            color: '#6366F1',
            bgColor: theme.dark ? '#1E1B4B' : '#E0E7FF',
          };
        if (progressPercent >= 50)
          return {
            label: t('halfwayLabel'),
            color: '#F59E0B',
            bgColor: theme.dark ? '#451A03' : '#FEF3C7',
          };
        if (progressPercent >= 25)
          return {
            label: t('rootedLabel'),
            color: '#3B82F6',
            bgColor: theme.dark ? '#172554' : '#DBEAFE',
          };
        return {
          label: t('initiatedLabel'),
          color: theme.colors.onSurfaceVariant,
          bgColor: theme.colors.outlineVariant,
        };
      })();

      return (
        <ScaleDecorator>
          <Animated.View entering={FadeInUp.duration(300)}>
            <Card
              style={[
                styles.card,
                {
                  borderColor: isActive
                    ? theme.colors.primary
                    : theme.colors.outline,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={() => handleGoalPress(item.id)}
              onLongPress={drag}
              disabled={isActive}
              mode="contained"
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: `${goalColor}12`,
                        borderColor: `${goalColor}2B`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getValidGoalIcon(item.icon) as any}
                      size={20}
                      color={goalColor}
                    />
                  </View>

                  <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                      <Text style={styles.name}>{item.name}</Text>
                      <View
                        style={[
                          styles.milestoneBadge,
                          {
                            backgroundColor: milestoneTag.bgColor,
                            borderColor: `${milestoneTag.color}2B`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.milestoneBadgeText,
                            { color: milestoneTag.color },
                          ]}
                        >
                          {milestoneTag.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.amountText}>
                      {formatCurrency(item.currentAmount)}
                      <Text style={styles.targetLabel}>
                        {' '}
                        / {formatCurrency(item.targetAmount)}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.percentageContainer}>
                    <Text
                      style={[
                        styles.percentageText,
                        {
                          color: isCompleted
                            ? '#10B981'
                            : theme.colors.onSurface,
                        },
                      ]}
                    >
                      {Math.round(progressPercent)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <ProgressBar
                    progress={progressPercent / 100}
                    color={isCompleted ? '#10B981' : goalColor}
                    style={styles.progressBar}
                  />

                  {item.deadline && (
                    <View style={styles.deadlineRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={theme.colors.outline}
                      />
                      <Text style={styles.deadlineText}>
                        {new Date(item.deadline).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        </ScaleDecorator>
      );
    },
    [formatCurrency, handleGoalPress, styles, theme, t],
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DraggableFlatList
        data={goals}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => updateGoalsOrder(data)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
        ListHeaderComponent={
          goals.length > 0 ? (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.dashboardHeader}
            >
              <View style={styles.statCard}>
                <View style={styles.overviewTextRow}>
                  <View>
                    <Text style={styles.overviewLabel}>
                      {t('savingsCapital')}
                    </Text>
                    <Text style={styles.overviewValue}>
                      {formatCurrency(totalSaved)}
                      <Text style={styles.overviewTargetGoal}>
                        {' '}
                        / {formatCurrency(totalTarget)}
                      </Text>
                    </Text>
                  </View>
                  {completedCount > 0 && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>
                        {t('reachedGoalCount', { count: completedCount })}
                      </Text>
                    </View>
                  )}
                </View>

                <ProgressBar
                  progress={overallProgress}
                  color={theme.colors.primary}
                  style={styles.summaryBar}
                />

                <View style={styles.summaryFooterRow}>
                  <Text style={styles.summaryFooterText}>
                    {t('overallCompletionProgress')}
                  </Text>
                  <Text style={styles.summaryFooterPercent}>
                    {Math.round(overallProgress * 100)}%
                  </Text>
                </View>
              </View>

              {smartAdvice && (
                <View
                  style={[
                    styles.recommendationBox,
                    {
                      backgroundColor: smartAdvice.bgColor,
                      borderColor: `${smartAdvice.color}2B`,
                    },
                  ]}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={16}
                    color={smartAdvice.color}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={[
                      styles.recommendationText,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {smartAdvice.text}
                  </Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>{t('savingsMilestones')}</Text>
            </Animated.View>
          ) : null
        }
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Ionicons
                name="flag-outline"
                size={32}
                color={theme.colors.outline}
              />
            </View>
            <Text
              style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
            >
              {t('noGoalsDefined')}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.colors.outline }]}
            >
              {t('noGoalsSubtitleText')}
            </Text>
          </Animated.View>
        }
      />

      <BannerAdComponent />

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: (insets.bottom || 0) + 120,
            backgroundColor: theme.colors.primary,
          },
        ]}
        color="#fff"
        onPress={() => router.push('/add-goal')}
      />
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      paddingTop: spacing.xs,
    },
    dashboardHeader: {
      paddingHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
    },
    statCard: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness || 12,
      backgroundColor: theme.colors.surface,
      padding: 16,
      marginBottom: 12,
    },
    overviewTextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    overviewLabel: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    overviewValue: {
      fontSize: fontScale(20),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    overviewTargetGoal: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    completedBadge: {
      backgroundColor: theme.colors.incomeContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 100,
      borderWidth: 0.5,
      borderColor: `${theme.colors.income}2B`,
    },
    completedBadgeText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.income,
    },
    summaryBar: {
      height: 6,
      borderRadius: 3,
      marginBottom: 8,
    },
    summaryFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryFooterText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    summaryFooterPercent: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    recommendationBox: {
      borderWidth: 1,
      borderRadius: theme.roundness || 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    recommendationText: {
      flex: 1,
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      lineHeight: 16,
    },
    sectionTitle: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
      marginBottom: 10,
    },
    card: {
      marginBottom: 12,
      marginHorizontal: 16,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardContent: {
      padding: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
      fontSize: fontScale(15),
      letterSpacing: -0.1,
      marginRight: 6,
    },
    milestoneBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 100,
      borderWidth: 0.5,
    },
    milestoneBadgeText: {
      fontSize: fontScale(9),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    amountText: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    targetLabel: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    percentageContainer: {
      alignItems: 'flex-end',
      marginLeft: 8,
    },
    percentageText: {
      fontSize: fontScale(15),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    progressSection: {
      marginTop: 4,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(0,0,0,0.03)',
    },
    deadlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    deadlineText: {
      marginLeft: 4,
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      color: theme.colors.outline,
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 80,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      marginBottom: 6,
    },
    emptySubtitle: {
      textAlign: 'center',
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      paddingHorizontal: 20,
      lineHeight: 18,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 18,
      elevation: 6,
    },
  });
