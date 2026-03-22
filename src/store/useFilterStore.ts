import { create } from 'zustand';
import {
  DateRange,
  FilterType,
  getAllTimeRange,
  getMonthRange,
  getRangeForType,
} from '../utils/dateFilters';

interface FilterState {
  selectedRange: DateRange;
  setFilter: (type: FilterType, customStart?: Date, customEnd?: Date) => void;
  setCustomRange: (startDate: Date, endDate: Date) => void;
  clearFilter: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedRange: getMonthRange(),

  setFilter: (type, customStart, customEnd) => {
    set({ selectedRange: getRangeForType(type, customStart, customEnd) });
  },

  setCustomRange: (startDate, endDate) => {
    set({ selectedRange: { type: 'custom', startDate, endDate } });
  },

  clearFilter: () => {
    set({ selectedRange: getAllTimeRange() });
  },
}));
