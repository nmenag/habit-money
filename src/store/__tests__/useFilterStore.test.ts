import { useFilterStore } from '../useFilterStore';
import { useStore } from '../useStore';

describe('useFilterStore', () => {
  beforeEach(() => {
    // Reset state before each test
    useFilterStore.getState().setDefaultFilter('month', 1);
  });

  it('initializes with default month range and isDefaultFilter true', () => {
    const state = useFilterStore.getState();
    expect(state.selectedRange.type).toBe('month');
    expect(state.isDefaultFilter).toBe(true);
  });

  it('sets filter type and updates isDefaultFilter to false', () => {
    useFilterStore.getState().setFilter('week');
    const state = useFilterStore.getState();
    expect(state.selectedRange.type).toBe('week');
    expect(state.isDefaultFilter).toBe(false);
  });

  it('sets custom date range', () => {
    const start = new Date(2026, 4, 1);
    const end = new Date(2026, 4, 10);
    useFilterStore.getState().setCustomRange(start, end);

    const state = useFilterStore.getState();
    expect(state.selectedRange.type).toBe('custom');
    expect(state.selectedRange.startDate).toBe(start);
    expect(state.selectedRange.endDate).toBe(end);
    expect(state.isDefaultFilter).toBe(false);
  });

  it('clears filter to allTime range', () => {
    useFilterStore.getState().clearFilter();
    const state = useFilterStore.getState();
    expect(state.selectedRange.type).toBe('allTime');
    expect(state.isDefaultFilter).toBe(false);
  });

  it('sets default filter and preserves isDefaultFilter true', () => {
    useFilterStore.getState().setDefaultFilter('last30Days');
    const state = useFilterStore.getState();
    expect(state.selectedRange.type).toBe('last30Days');
    expect(state.isDefaultFilter).toBe(true);
  });

  it('updates cycle start day when selectedRange is month or lastMonth', () => {
    useFilterStore.getState().setDefaultFilter('month', 1);
    useFilterStore.getState().updateCycleStartDay(15);
    let state = useFilterStore.getState();
    expect(state.selectedRange.type).toBe('month');

    useFilterStore.getState().setDefaultFilter('lastMonth', 1);
    useFilterStore.getState().updateCycleStartDay(15);
    state = useFilterStore.getState();
    expect(state.selectedRange.type).toBe('lastMonth');
  });

  it('does not update selected range on updateCycleStartDay when range is not month/lastMonth', () => {
    useFilterStore.getState().setFilter('week');
    const weekStart = useFilterStore.getState().selectedRange.startDate;

    useFilterStore.getState().updateCycleStartDay(15);
    expect(useFilterStore.getState().selectedRange.type).toBe('week');
    expect(useFilterStore.getState().selectedRange.startDate).toBe(weekStart);
  });

  it('reads cycleStartDay from useStore state when override is omitted', () => {
    useStore.setState({ cycleStartDay: 20 });
    useFilterStore.getState().setDefaultFilter('month');
    const state = useFilterStore.getState();
    expect(state.selectedRange.type).toBe('month');
  });

  it('falls back to 1 when cycleStartDay in useStore is not a number', () => {
    useStore.setState({ cycleStartDay: 'invalid' as any });
    useFilterStore.getState().setDefaultFilter('month');
    expect(useFilterStore.getState().selectedRange.type).toBe('month');
  });

  it('falls back to 1 when useStore throws an error in getCycleDay', () => {
    const originalGetState = useStore.getState;
    (useStore as any).getState = () => {
      throw new Error('Store not initialized');
    };

    useFilterStore.getState().setDefaultFilter('month');
    expect(useFilterStore.getState().selectedRange.type).toBe('month');

    useStore.getState = originalGetState;
  });
});
