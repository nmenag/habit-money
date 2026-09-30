export type FilterType =
  | 'allTime'
  | 'today'
  | 'week'
  | 'month'
  | 'lastMonth'
  | 'last30Days'
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthRange(
  cycleStartDay: number = 1,
  referenceDate: Date = new Date(),
): DateRange {
  const safeCycleDay = Math.max(1, Math.min(31, cycleStartDay));
  if (safeCycleDay === 1) {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      type: 'month',
      startDate,
      endDate,
    };
  }

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let startYear = year;
  let startMonth = month;
  let endYear = year;
  let endMonth = month + 1;

  if (day < safeCycleDay) {
    startMonth = month - 1;
    endMonth = month;
  }

  const startMaxDay = getDaysInMonth(startYear, startMonth);
  const startDate = new Date(
    startYear,
    startMonth,
    Math.min(safeCycleDay, startMaxDay),
    0,
    0,
    0,
    0,
  );

  const endMaxDay = getDaysInMonth(endYear, endMonth);
  const nextCycleStart = new Date(
    endYear,
    endMonth,
    Math.min(safeCycleDay, endMaxDay),
    0,
    0,
    0,
    0,
  );

  const endDate = new Date(nextCycleStart.getTime() - 1);

  return {
    type: 'month',
    startDate,
    endDate,
  };
}

export function getLastMonthRange(
  cycleStartDay: number = 1,
  referenceDate: Date = new Date(),
): DateRange {
  const currentRange = getMonthRange(cycleStartDay, referenceDate);
  const prevRefDate = new Date(currentRange.startDate.getTime() - 1);
  const prevRange = getMonthRange(cycleStartDay, prevRefDate);
  return {
    ...prevRange,
    type: 'lastMonth',
  };
}

export function getLast30DaysRange(): DateRange {
  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 30,
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
  return {
    type: 'last30Days',
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
  cycleStartDay: number = 1,
): DateRange {
  switch (type) {
    case 'allTime':
      return getAllTimeRange();
    case 'today':
      return getTodayRange();
    case 'week':
      return getWeekRange();
    case 'month':
      return getMonthRange(cycleStartDay);
    case 'lastMonth':
      return getLastMonthRange(cycleStartDay);
    case 'last30Days':
      return getLast30DaysRange();
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

export function getPreviousPeriodRange(
  range: DateRange,
  cycleStartDay: number = 1,
): DateRange | null {
  if (range.type === 'allTime') {
    return null;
  }

  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (range.type === 'month' || range.type === 'lastMonth') {
    const prevRefDate = new Date(start.getTime() - 1);
    const prevRange = getMonthRange(cycleStartDay, prevRefDate);
    return {
      type: 'custom',
      startDate: prevRange.startDate,
      endDate: prevRange.endDate,
    };
  }

  if (range.type === 'year') {
    return {
      type: 'custom',
      startDate: new Date(start.getFullYear() - 1, 0, 1, 0, 0, 0, 0),
      endDate: new Date(start.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
    };
  }

  const prevStart = new Date(start.getTime() - diffDays * 24 * 60 * 60 * 1000);
  const prevEnd = new Date(start.getTime() - 1);

  return {
    type: 'custom',
    startDate: prevStart,
    endDate: prevEnd,
  };
}
