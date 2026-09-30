export const getLocalISOString = (date?: Date): string => {
  const d = date || new Date();
  const pad = (n: number, length = 2) => String(n).padStart(length, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

export const getLocalDateString = (date?: Date): string => {
  const d = date || new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
