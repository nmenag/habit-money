import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { getDb } from '../../../db/schema';
import { useStore, useTranslation } from '../../../store/useStore';
import { AppTheme, featureColors } from '../../../theme/theme';
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

const addAlpha = (
  color: string | undefined,
  opacity: number,
  fallbackHex: string,
): string => {
  let resolvedColor = color || fallbackHex;
  if (typeof resolvedColor !== 'string') {
    resolvedColor = fallbackHex;
  }
  if (!resolvedColor.startsWith('#')) {
    resolvedColor = fallbackHex;
  }
  const hex = resolvedColor.replace('#', '');
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${hex}${alpha}`;
};

export const EmergencyFundCard: React.FC = () => {
  const { t } = useTranslation();
  const formatCurrency = useStore((s) => s.formatCurrency);
  const transactions = useStore((s) => s.transactions);
  const router = useRouter();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const [months, setMonths] = useState<MonthData[]>([]);

  useEffect(() => {
    setMonths(loadMonthlyExpenses());
  }, [transactions]);

  const avgMonthlyExpense = useMemo(() => {
    if (months.length === 0) return 0;
    const total = months.reduce((sum, m) => sum + m.totalExpense, 0);
    return total / months.length;
  }, [months]);

  const recommendedTarget = useMemo(
    () => Math.round(avgMonthlyExpense * DEFAULT_MONTHS_TO_COVER),
    [avgMonthlyExpense],
  );

  return (
    <Card
      style={[
        styles.card,
        {
          borderColor: theme.colors.outlineVariant,
          borderWidth: 1,
        },
      ]}
      mode="contained"
    >
      <Card.Content style={styles.cardContent}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/emergency-fund' as any)}
          style={styles.headerRow}
        >
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: addAlpha(
                    featureColors.emergencyFund,
                    0.12,
                    '#22C55E',
                  ),
                  borderColor: addAlpha(
                    featureColors.emergencyFund,
                    0.25,
                    '#22C55E',
                  ),
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={featureColors.emergencyFund}
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.onSurface,
                    fontFamily: 'Inter-SemiBold',
                    fontWeight: '600',
                  },
                ]}
              >
                {t('emergencyFund')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: theme.colors.onSurfaceVariant,
                    fontFamily: 'Inter-Regular',
                    fontWeight: '400',
                  },
                ]}
              >
                {t('emergencyTargetMonths', {
                  months: DEFAULT_MONTHS_TO_COVER,
                })}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        {months.length > 0 ? (
          <View style={styles.metricsContainer}>
            <View style={styles.metricBox}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('monthlyExpenseAverage')}
              </Text>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color: theme.colors.onSurface,
                    fontFamily: 'Inter-SemiBold',
                    fontWeight: '600',
                    fontSize: fontScale(15),
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(avgMonthlyExpense)}
              </Text>
            </View>

            <View
              style={[
                styles.metricDivider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />

            <View style={styles.metricBox}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('targetReserve')}
              </Text>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color: featureColors.emergencyFund,
                    fontFamily: 'Inter-SemiBold',
                    fontWeight: '600',
                    fontSize: fontScale(15),
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(recommendedTarget)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {t('noExpenseDataForMonths')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/emergency-fund' as any)}
          style={styles.actionRow}
        >
          <Text
            style={[
              styles.actionText,
              {
                color: featureColors.emergencyFund,
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
              },
            ]}
          >
            {t('viewCalculationAndDetails')}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={14}
            color={featureColors.emergencyFund}
          />
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      borderRadius: 20,
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    cardContent: {
      padding: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTextContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
    },
    subtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    metricsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 14,
      padding: 12,
      marginTop: 14,
      alignItems: 'center',
    },
    metricBox: {
      flex: 1,
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    metricValue: {},
    metricDivider: {
      width: 1,
      height: '80%',
      marginHorizontal: 8,
    },
    emptyState: {
      marginTop: 12,
      padding: 12,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 14,
      gap: 6,
    },
    actionText: {
      fontSize: 13,
    },
  });
