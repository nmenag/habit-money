import { create } from 'zustand';
import {
  DateRange,
  FilterType,
  getAllTimeRange,
  getLast30DaysRange,
  getRangeForType,
} from '../utils/dateFilters';

interface FilterState {
  selectedRange: DateRange;
  setFilter: (type: FilterType, customStart?: Date, customEnd?: Date) => void;
  setCustomRange: (startDate: Date, endDate: Date) => void;
  clearFilter: () => void;
  initDefaultFilter: (firstDate: Date | null) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedRange: getLast30DaysRange(),

  setFilter: (type, customStart, customEnd) => {
    set({ selectedRange: getRangeForType(type, customStart, customEnd) });
  },

  setCustomRange: (startDate, endDate) => {
    set({ selectedRange: { type: 'custom', startDate, endDate } });
  },

  clearFilter: () => {
    set({ selectedRange: getAllTimeRange() });
  },

  initDefaultFilter: (firstDate: Date | null) => {
    if (!firstDate) {
      set({ selectedRange: getLast30DaysRange() });
      return;
    }

    const now = new Date();
    const daysSinceFirst = Math.floor(
      (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceFirst < 30) {
      set({ selectedRange: getAllTimeRange() });
    } else {
      set({ selectedRange: getLast30DaysRange() });
    }
  },
}));
