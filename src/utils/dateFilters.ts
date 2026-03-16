import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';

export type FilterType = 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'custom';

export interface DateRange {
  type: FilterType;
  startDate: Date;
  endDate: Date;
}

export function getTodayRange(): DateRange {
  const now = new Date();
  return {
    type: 'today',
    startDate: startOfDay(now),
    endDate: endOfDay(now),
  };
}

export function getWeekRange(): DateRange {
  const now = new Date();
  return {
    type: 'week',
    startDate: startOfWeek(now, { weekStartsOn: 1 }),
    endDate: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(): DateRange {
  const now = new Date();
  return {
    type: 'month',
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
  };
}

export function getLastMonthRange(): DateRange {
  const lastMonth = subMonths(new Date(), 1);
  return {
    type: 'lastMonth',
    startDate: startOfMonth(lastMonth),
    endDate: endOfMonth(lastMonth),
  };
}

export function getYearRange(): DateRange {
  const now = new Date();
  return {
    type: 'year',
    startDate: startOfYear(now),
    endDate: endOfYear(now),
  };
}

export function getRangeForType(type: FilterType, customStart?: Date, customEnd?: Date): DateRange {
  switch (type) {
    case 'today':
      return getTodayRange();
    case 'week':
      return getWeekRange();
    case 'month':
      return getMonthRange();
    case 'lastMonth':
      return getLastMonthRange();
    case 'year':
      return getYearRange();
    case 'custom':
      return {
        type: 'custom',
        startDate: customStart ?? startOfDay(new Date()),
        endDate: customEnd ?? endOfDay(new Date()),
      };
    default:
      return getMonthRange();
  }
}

/** Returns true if the given ISO date string falls within [start, end] */
export function isInRange(isoDate: string, range: DateRange): boolean {
  const d = new Date(isoDate);
  return d >= range.startDate && d <= range.endDate;
}
