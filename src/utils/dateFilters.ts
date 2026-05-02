export type FilterType =
  | 'allTime'
  | 'today'
  | 'week'
  | 'month'
  | 'lastMonth'
  | 'year'
  | 'custom';

export interface DateRange {
  type: FilterType;
  startDate: Date;
  endDate: Date;
}

export function getAllTimeRange(): DateRange {
  return {
    type: 'allTime',
    startDate: new Date(0),
    endDate: new Date(8640000000000000),
  };
}

export function getTodayRange(): DateRange {
  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  return { type: 'today', startDate, endDate };
}

export function getWeekRange(): DateRange {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    diff,
    0,
    0,
    0,
    0,
  );
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return {
    type: 'week',
    startDate,
    endDate,
  };
}

export function getMonthRange(): DateRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return {
    type: 'month',
    startDate,
    endDate,
  };
}

export function getLastMonthRange(): DateRange {
  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
    0,
    0,
    0,
    0,
  );
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );
  return {
    type: 'lastMonth',
    startDate,
    endDate,
  };
}

export function getYearRange(): DateRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { type: 'year', startDate, endDate };
}

export function getRangeForType(
  type: FilterType,
  customStart?: Date,
  customEnd?: Date,
): DateRange {
  switch (type) {
    case 'allTime':
      return getAllTimeRange();
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
      const now = new Date();
      return {
        type: 'custom',
        startDate:
          customStart ??
          new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0,
            0,
          ),
        endDate:
          customEnd ??
          new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59,
            999,
          ),
      };
    default:
      return getAllTimeRange();
  }
}

export function isInRange(isoDate: string, range: DateRange): boolean {
  if (range.type === 'allTime') return true;
  const d = new Date(isoDate);
  return d >= range.startDate && d <= range.endDate;
}
