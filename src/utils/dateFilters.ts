// No imports needed after manual UTC switch

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
  /** For 'allTime', startDate is epoch zero — use isInRange which short-circuits */
  startDate: Date;
  endDate: Date;
}

// ─── Preset range builders ────────────────────────────────────────────────────

export function getAllTimeRange(): DateRange {
  return {
    type: 'allTime',
    startDate: new Date(0), // epoch zero
    endDate: new Date(8640000000000000), // max JS date
  };
}

export function getTodayRange(): DateRange {
  const now = new Date();
  const startDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const endDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
  return { type: 'today', startDate, endDate };
}

export function getWeekRange(): DateRange {
  const now = new Date();
  const day = now.getUTCDay(); // 0 is Sunday
  // Calculate Monday (start of week)
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0),
  );
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  endDate.setUTCHours(23, 59, 59, 999);

  return {
    type: 'week',
    startDate,
    endDate,
  };
}

export function getMonthRange(): DateRange {
  const now = new Date();
  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
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
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0),
  );
  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999),
  );
  return {
    type: 'lastMonth',
    startDate,
    endDate,
  };
}

export function getYearRange(): DateRange {
  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999),
  );
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
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate(),
              0,
              0,
              0,
              0,
            ),
          ),
        endDate:
          customEnd ??
          new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate(),
              23,
              59,
              59,
              999,
            ),
          ),
      };
    default:
      return getAllTimeRange();
  }
}

/** Returns true if the given ISO date string falls within [start, end].
 *  For 'allTime' this always returns true (fast path). */
export function isInRange(isoDate: string, range: DateRange): boolean {
  if (range.type === 'allTime') return true;
  const d = new Date(isoDate);
  return d >= range.startDate && d <= range.endDate;
}
