import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { useStore, useTranslation } from '../store/useStore';
import { FilterType } from '../utils/dateFilters';

interface FilterOption {
  type: FilterType;
  labelKey: string;
  short: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { type: 'allTime', labelKey: 'filterAllTime', short: 'All' },
  { type: 'today', labelKey: 'filterToday', short: 'Today' },
  { type: 'week', labelKey: 'filterWeek', short: 'Week' },
  { type: 'month', labelKey: 'filterMonth', short: 'Month' },
  { type: 'lastMonth', labelKey: 'filterLastMonth', short: 'Last Mo.' },
  { type: 'year', labelKey: 'filterYear', short: 'Year' },
  { type: 'custom', labelKey: 'filterCustom', short: 'Custom' },
];

export const FilterBar: React.FC = React.memo(() => {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useStore((s) => s.language);
  const selectedRange = useStore((s) => s.selectedRange);
  const setFilterType = useStore((s) => s.setFilterType);
  const setSelectedRange = useStore((s) => s.setSelectedRange);
  const clearFilter = useStore((s) => s.clearFilter);

  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelect = (option: FilterOption) => {
    if (option.type === 'custom') {
      setPickerOpen(true);
    } else {
      setFilterType(option.type);
    }
  };

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
        setSelectedRange({
          type: 'custom',
          startDate,
          endDate: endFull,
        });
      }
    },
    [setSelectedRange],
  );

  const getLabel = (option: FilterOption): string => {
    const raw = t(option.labelKey as any);
    return raw === option.labelKey ? option.short : raw;
  };

  const activeType = selectedRange.type;
  const isFiltered = activeType !== 'allTime';

  const customSummary =
    activeType === 'custom'
      ? `${format(selectedRange.startDate, 'MMM d', {
          locale: language === 'es' ? es : enUS,
        })} – ${format(selectedRange.endDate, 'MMM d, yyyy', {
          locale: language === 'es' ? es : enUS,
        })}`
      : null;

  const locale = language === 'es' ? 'es' : 'en';

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

          return (
            <TouchableOpacity
              key={option.type}
              onPress={() => handleSelect(option)}
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
              {option.type === 'custom' && (
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={isActive ? '#fff' : theme.colors.onSurfaceVariant}
                  style={{ marginRight: 4 }}
                />
              )}
              {isAllTime && (
                <Ionicons
                  name="infinite-outline"
                  size={12}
                  color={isActive ? '#fff' : theme.colors.onSurfaceVariant}
                  style={{ marginRight: 4 }}
                />
              )}

              <Text
                variant="labelSmall"
                style={{
                  color: isActive ? '#fff' : theme.colors.onSurfaceVariant,
                  fontWeight: isActive ? '700' : '500',
                  fontSize: 12,
                }}
              >
                {getLabel(option)}
              </Text>

              {isActive && isFiltered && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    clearFilter();
                  }}
                  hitSlop={6}
                  style={styles.chipClose}
                >
                  <Ionicons
                    name="close-circle"
                    size={14}
                    color="rgba(255,255,255,0.9)"
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {customSummary && (
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
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
