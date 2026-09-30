import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { useFilterStore } from '../../../store/useFilterStore';
import { useStore, useTranslation } from '../../../store/useStore';
import { FilterType } from '../../../utils/dateFilters';

interface FilterOption {
  type: FilterType;
  labelKey: string;
  short: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { type: 'allTime', labelKey: 'filterAllTime', short: 'All' },
  { type: 'today', labelKey: 'filterToday', short: 'Today' },
  { type: 'week', labelKey: 'filterWeek', short: 'Week' },
  { type: 'last30Days', labelKey: 'filterLast30Days', short: 'Last 30 Days' },
  { type: 'month', labelKey: 'filterMonth', short: 'Month' },
  { type: 'lastMonth', labelKey: 'filterLastMonth', short: 'Last Mo.' },
  { type: 'year', labelKey: 'filterYear', short: 'Year' },
  { type: 'custom', labelKey: 'filterCustom', short: 'Custom' },
];

export const FilterBar: React.FC = React.memo(() => {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useStore((s) => s.language);

  const selectedRange = useFilterStore((s) => s.selectedRange);
  const setFilter = useFilterStore((s) => s.setFilter);
  const setCustomRange = useFilterStore((s) => s.setCustomRange);
  const clearFilter = useFilterStore((s) => s.clearFilter);

  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelect = useCallback(
    (type: FilterType) => {
      if (type === 'custom') {
        setPickerOpen(true);
      } else {
        setFilter(type);
      }
    },
    [setFilter],
  );

  const onDismiss = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const onConfirm = useCallback(
    ({
      startDate,
      endDate,
    }: {
      startDate: Date | undefined;
      endDate: Date | undefined;
    }) => {
      setPickerOpen(false);
      if (startDate) {
        const end = endDate ?? startDate;
        const endFull = new Date(end);
        endFull.setHours(23, 59, 59, 999);
        setCustomRange(startDate, endFull);
      }
    },
    [setCustomRange],
  );

  const activeType = selectedRange.type;
  const isFiltered = activeType !== 'allTime';

  const customSummary = useMemo(
    () =>
      activeType === 'custom'
        ? `${format(new Date(selectedRange.startDate), 'MMM d', {
            locale: language === 'es' ? es : enUS,
          })} – ${format(new Date(selectedRange.endDate), 'MMM d, yyyy', {
            locale: language === 'es' ? es : enUS,
          })}`
        : null,
    [activeType, selectedRange.startDate, selectedRange.endDate, language],
  );

  const locale = language === 'es' ? 'es' : 'en';

  const handleClear = useCallback(
    (e: any) => {
      e.stopPropagation();
      clearFilter();
    },
    [clearFilter],
  );

  const handleOpenPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeType === option.type;
          const isAllTime = option.type === 'allTime';
          const label = t(option.labelKey as any);
          const displayLabel = label === option.labelKey ? option.short : label;

          return (
            <TouchableOpacity
              key={option.type}
              onPress={() => handleSelect(option.type)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                  borderColor: isActive
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
                  ...(isAllTime &&
                    !isActive && { borderStyle: 'dashed' as const }),
                },
              ]}
            >
              {(option.type === 'custom' || isAllTime) && (
                <Ionicons
                  name={
                    option.type === 'custom'
                      ? 'calendar-outline'
                      : 'infinite-outline'
                  }
                  size={12}
                  color={
                    isActive
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant
                  }
                  style={{ marginRight: 4 }}
                />
              )}

              <Text
                variant="labelSmall"
                style={{
                  color: isActive
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant,
                  fontWeight: isActive ? '700' : '500',
                  fontSize: 12,
                }}
              >
                {displayLabel}
              </Text>

              {isActive && isFiltered && (
                <TouchableOpacity
                  onPress={handleClear}
                  hitSlop={6}
                  style={styles.chipClose}
                >
                  <Ionicons
                    name="close-circle"
                    size={14}
                    color={theme.colors.onPrimary}
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {customSummary && (
        <TouchableOpacity
          onPress={handleOpenPicker}
          activeOpacity={0.8}
          style={[
            styles.customBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Ionicons
            name="calendar"
            size={12}
            color={theme.colors.onPrimaryContainer}
          />
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onPrimaryContainer,
              marginLeft: 4,
              fontWeight: '600',
            }}
          >
            {customSummary}
          </Text>
          <Ionicons
            name="pencil"
            size={10}
            color={theme.colors.onPrimaryContainer}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      )}

      <DatePickerModal
        locale={locale}
        mode="range"
        visible={pickerOpen}
        onDismiss={onDismiss}
        startDate={
          activeType === 'custom' ? selectedRange.startDate : undefined
        }
        endDate={activeType === 'custom' ? selectedRange.endDate : undefined}
        onConfirm={onConfirm}
        label={t('filterCustomRange' as any)}
        startLabel={t('filterStartDate' as any)}
        endLabel={t('filterEndDate' as any)}
        saveLabel={t('filterApply' as any)}
        inputEnabled
      />
    </View>
  );
});

FilterBar.displayName = 'FilterBar';

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipClose: {
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
});
