import { format } from 'date-fns';

export const getUtcNow = () => {
  return new Date();
};

export const getUtcDate = (date?: Date) => {
  const d = date || new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
};

export const formatUtcMonth = (date: Date, locale: any) => {
  // Use UTC values for formatting
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // Create a local date with UTC values for formatting (since format uses local by default)
  const localDate = new Date(year, month, 1);
  return format(localDate, 'MMMM yyyy', { locale });
};
