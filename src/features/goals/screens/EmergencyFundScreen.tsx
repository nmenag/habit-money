import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDb } from '../../../db/schema';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme, featureColors, spacing } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

interface MonthData {
  month: string;
  totalExpense: number;
}

const DEFAULT_MONTHS_TO_COVER = 6;

const loadMonthlyExpenses = (): MonthData[] => {
  try {
    const db = getDb();
    return db.getAllSync<MonthData>(`
      SELECT
        substr(date, 1, 7) as month,
        SUM(amount) as totalExpense
      FROM transactions
      WHERE type = 'expense'
        AND (note IS NULL OR note NOT IN ('Balance Adjustment', 'Ajuste de Saldo'))
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
  } catch {
    return [];
  }
};

export const EmergencyFundScreen = () => {
  const { t, language } = useTranslation();
  const formatCurrency = useStore((s) => s.formatCurrency);
  const insets = useSafeAreaInsets();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const [months, setMonths] = useState<MonthData[]>([]);

  useEffect(() => {
    setMonths(loadMonthlyExpenses());
  }, []);

  const avgMonthlyExpense = useMemo(() => {
    if (months.length === 0) return 0;
    const total = months.reduce((sum, m) => sum + m.totalExpense, 0);
    return total / months.length;
  }, [months]);

  const recommendedTarget = useMemo(
    () => Math.round(avgMonthlyExpense * DEFAULT_MONTHS_TO_COVER),
    [avgMonthlyExpense],
  );

  const formatMonthLabel = useCallback(
    (monthStr: string) => {
      try {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const str = format(date, 'MMMM yyyy', {
          locale: language === 'es' ? esLocale : enUS,
        });
        return str.charAt(0).toUpperCase() + str.slice(1);
      } catch {
        return monthStr;
      }
    },
    [language],
  );

  const hasData = months.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn} style={styles.headerBlock}>
          <View style={styles.headerIconCircle}>
            <Ionicons
              name="shield-checkmark"
              size={32}
              color={featureColors.emergencyFund}
            />
          </View>
          <Text style={styles.headerTitle}>{t('emergencyFund')}</Text>
          <Text style={styles.headerSubtitle}>{t('emergencyFundDesc')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80)}>
          <Card style={styles.infoCard}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>
                {t('whatIsEmergencyFundTitle')}
              </Text>
              <Text style={styles.bodyText}>
                {t('whatIsEmergencyFundBody')}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140)}>
          <Card style={styles.infoCard}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>
                {t('howMuchDoINeedTitle')}
              </Text>
              <Text style={styles.bodyText}>{t('howMuchDoINeedBody')}</Text>

              <View style={styles.pillRow}>
                {[3, 6, 9, 12].map((m) => (
                  <View key={m} style={styles.pill}>
                    <Text style={styles.pillNumber}>{m}</Text>
                    <Text style={styles.pillLabel}>{t('monthsUnit')}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {hasData ? (
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card style={styles.calcCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.calcTitleRow}>
                  <Ionicons
                    name="calculator-outline"
                    size={18}
                    color={featureColors.emergencyFund}
                  />
                  <Text style={styles.sectionTitle}>
                    {t('personalEstimateTitle')}
                  </Text>
                </View>
                <Text style={styles.calcSubtitle}>
                  {t('basedOnRecordedExpenses', { count: months.length })}
                </Text>

                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>
                    {t('monthlyExpenseAverage')}
                  </Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(avgMonthlyExpense)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.targetBlock}>
                  <Text style={styles.targetLabel}>
                    {t('recommendedFundMonths', {
                      months: DEFAULT_MONTHS_TO_COVER,
                    })}
                  </Text>
                  <Text style={styles.targetAmount}>
                    {formatCurrency(recommendedTarget)}
                  </Text>
                </View>

                <View style={styles.monthBreakdown}>
                  <Text style={styles.breakdownHeader}>
                    {t('monthlyBreakdownTitle')}
                  </Text>
                  {months.slice(0, 6).map((m) => (
                    <View key={m.month} style={styles.monthRow}>
                      <Text style={styles.monthLabel}>
                        {formatMonthLabel(m.month)}
                      </Text>
                      <Text style={styles.monthAmount}>
                        {formatCurrency(m.totalExpense)}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card style={styles.infoCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.emptyRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.emptyText}>
                    {t('noExpenseDataForMonths')}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(260)}>
          <Card style={styles.tipsCard}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.sectionTitle}>
                {t('tipsToGetStartedTitle')}
              </Text>
              {[
                t('tipStartSmall'),
                t('tipSeparateAccount'),
                t('tipAutomateSavings'),
                t('tipInitialGoalOneMonth'),
              ].map((tip, i) => (
                <Text key={i} style={styles.tipItem}>
                  {tip}
                </Text>
              ))}
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: spacing.md,
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
      gap: spacing.md,
    },
    headerBlock: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    headerIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.dark ? '#052E16' : '#DCFCE7',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    headerTitle: {
      fontSize: fontScale(24),
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    headerSubtitle: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 22,
    },
    infoCard: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    calcCard: {
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: featureColors.emergencyFund + '40',
    },
    tipsCard: {
      borderRadius: theme.roundness,
      backgroundColor: theme.dark ? '#052E16' : '#ECFDF5',
      borderWidth: 1,
      borderColor: featureColors.emergencyFund + '50',
    },
    cardContent: {
      padding: spacing.md,
    },
    sectionTitle: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.onSurface,
      marginBottom: spacing.sm,
    },
    bodyText: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      lineHeight: 22,
    },
    pillRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
      justifyContent: 'center',
    },
    pill: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      backgroundColor: theme.dark ? '#064E3B' : '#F0FDF4',
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: featureColors.emergencyFund + '40',
    },
    pillNumber: {
      fontSize: fontScale(20),
      fontFamily: 'Inter-SemiBold',
      color: featureColors.emergencyFund,
    },
    pillLabel: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
    },
    calcTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    calcSubtitle: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.md,
      lineHeight: 20,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statLabel: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      flex: 1,
      marginRight: spacing.sm,
    },
    statValue: {
      fontSize: fontScale(15),
      fontFamily: 'Inter-SemiBold',
      color: theme.colors.onSurface,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: spacing.md,
    },
    targetBlock: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      backgroundColor: theme.dark ? '#052E16' : '#F0FDF4',
      borderRadius: theme.roundness,
      marginBottom: spacing.md,
    },
    targetLabel: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      color: theme.dark ? '#6EE7B7' : '#047857',
      marginBottom: spacing.xs,
    },
    targetAmount: {
      fontSize: fontScale(28),
      fontFamily: 'Inter-SemiBold',
      color: featureColors.emergencyFund,
    },
    monthBreakdown: {
      gap: spacing.xs,
    },
    breakdownHeader: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.xs,
    },
    monthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    monthLabel: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
    },
    monthAmount: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Medium',
      color: theme.colors.onSurface,
    },
    emptyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    emptyText: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    tipItem: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Regular',
      color: theme.dark ? '#D1FAE5' : '#065F46',
      lineHeight: 24,
    },
  });
