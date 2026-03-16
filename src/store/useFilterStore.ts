import { create } from 'zustand';
import { DateRange, FilterType, getRangeForType, getMonthRange } from '../utils/dateFilters';

interface FilterState {
  selectedRange: DateRange;
  setFilter: (type: FilterType, customStart?: Date, customEnd?: Date) => void;
  setCustomRange: (startDate: Date, endDate: Date) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  // Default: This Month
  selectedRange: getMonthRange(),

  setFilter: (type, customStart, customEnd) => {
    set({ selectedRange: getRangeForType(type, customStart, customEnd) });
  },

  setCustomRange: (startDate, endDate) => {
    set({
      selectedRange: {
        type: 'custom',
        startDate,
        endDate,
      },
    });
  },
}));
