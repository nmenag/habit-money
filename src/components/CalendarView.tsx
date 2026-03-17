import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useStore, useTranslation } from '../store/useStore';

const formatAmount = (amount: number, formatCurrency: any) => {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'k';
  return formatCurrency(amount);
};

interface CalendarViewProps {
  selectedDate: Date;
  onDayPress: (date: Date) => void;
}

export const CalendarView = ({
  selectedDate,
  onDayPress,
}: CalendarViewProps) => {
  const { transactions, formatCurrency } = useStore();
  const { language } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const dateLocale = language === 'es' ? esLocale : enUS;

  // Generate weekday names based on locale
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(format(addDays(startDate, i), 'eee', { locale: dateLocale }));
    }
    return days;
  }, [dateLocale, startDate]);

  const transactionsByDate = transactions.reduce(
    (acc, current) => {
      let dateStr = '';
      try {
        dateStr = new Date(current.date).toISOString().split('T')[0];
      } catch {
        dateStr = current.date.split('T')[0];
      }
      if (!acc[dateStr]) acc[dateStr] = { income: 0, expense: 0 };
      if (current.type === 'income') acc[dateStr].income += current.amount;
      else acc[dateStr].expense += current.amount;
      return acc;
    },
    {} as Record<string, { income: number; expense: number }>,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" size={24} onPress={handlePrevMonth} />
        <Text variant="titleMedium" style={styles.monthText}>
          {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
        </Text>
        <IconButton icon="chevron-right" size={24} onPress={handleNextMonth} />
      </View>

      <View style={styles.weekDays}>
        {weekDays.map((day, index) => (
          <Text
            key={`${day}-${index}`}
            variant="labelSmall"
            style={styles.weekDayText}
          >
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {daysInMonth.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayData = transactionsByDate[dateStr];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);

          return (
            <TouchableOpacity
              key={dateStr + index}
              onPress={() => onDayPress(day)}
              style={[
                styles.dayCell,
                !isCurrentMonth && styles.notCurrentMonth,
                isTodayDate && {
                  backgroundColor: theme.colors.primaryContainer,
                },
                isSelected && { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                variant="labelMedium"
                style={[
                  styles.dayText,
                  !isCurrentMonth && styles.notCurrentMonthText,
                  isTodayDate && {
                    color: theme.colors.primary,
                    fontWeight: 'bold',
                  },
                  isSelected && { color: '#fff', fontWeight: 'bold' },
                ]}
              >
                {format(day, 'd')}
              </Text>
              <View style={styles.amountsContainer}>
                {(dayData?.income || 0) > 0 && (
                  <Text style={styles.incomeAmount} numberOfLines={1}>
                    +{formatAmount(dayData!.income, formatCurrency)}
                  </Text>
                )}
                {(dayData?.expense || 0) > 0 && (
                  <Text style={styles.expenseAmount} numberOfLines={1}>
                    -{formatAmount(dayData!.expense, formatCurrency)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 12,
      marginVertical: 12,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    monthText: {
      fontWeight: '900',
      color: theme.colors.onSurface,
      textTransform: 'capitalize',
    },
    weekDays: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 8,
    },
    weekDayText: {
      width: 40,
      textAlign: 'center',
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
    dayCell: {
      width: '14.28%',
      minHeight: 56,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingVertical: 6,
      borderRadius: 16,
    },
    notCurrentMonth: {
      opacity: 0.3,
    },
    dayText: {
      color: theme.colors.onSurface,
    },
    notCurrentMonthText: {
      color: theme.colors.onSurfaceVariant,
    },
    amountsContainer: {
      marginTop: 2,
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 2,
    },
    incomeAmount: {
      fontSize: 9,
      color: '#4caf50',
      fontWeight: '900',
    },
    expenseAmount: {
      fontSize: 9,
      color: '#f44336',
      fontWeight: '900',
    },
  });
