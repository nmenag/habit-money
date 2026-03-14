import { Ionicons } from '@expo/vector-icons';
import {
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
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../store/useStore';

const formatAmount = (amount: number) => {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'k';
  return Math.round(amount).toString();
};

interface CalendarViewProps {
  selectedDate: Date;
  onDayPress: (date: Date) => void;
}

export const CalendarView = ({
  selectedDate,
  onDayPress,
}: CalendarViewProps) => {
  const { transactions } = useStore();
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(currentDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDayText}>
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
                isTodayDate && styles.todayCell,
                isSelected && styles.selectedCell,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  !isCurrentMonth && styles.notCurrentMonthText,
                  isTodayDate && styles.todayText,
                  isSelected && styles.selectedText,
                ]}
              >
                {format(day, 'd')}
              </Text>
              <View style={styles.amountsContainer}>
                {(dayData?.income || 0) > 0 && (
                  <Text style={styles.incomeAmount} numberOfLines={1}>
                    +{formatAmount(dayData!.income)}
                  </Text>
                )}
                {(dayData?.expense || 0) > 0 && (
                  <Text style={styles.expenseAmount} numberOfLines={1}>
                    -{formatAmount(dayData!.expense)}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 4,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: '14.28%',
    minHeight: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: '#2196f3',
  },
  todayCell: {
    backgroundColor: '#f0f7ff',
  },
  notCurrentMonth: {
    opacity: 0.4,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notCurrentMonthText: {
    color: '#ccc',
  },
  todayText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  amountsContainer: {
    marginTop: 2,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  incomeAmount: {
    fontSize: 10,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  expenseAmount: {
    fontSize: 10,
    color: '#f44336',
    fontWeight: 'bold',
  },
});
