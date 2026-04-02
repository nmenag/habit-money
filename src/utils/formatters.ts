export const formatNumber = (amount: number, language: string = 'en') => {
  const separator = language === 'es' ? '.' : ',';
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

export const formatCurrency = (
  amount: number,
  currencyCode: string = 'COP',
  language: string = 'en',
) => {
  const symbols: { [key: string]: string } = {
    USD: '$',
    COP: '$',
    MXN: '$',
    EUR: '€',
  };
  const symbol = symbols[currencyCode] || '$';

  if (currencyCode === 'COP') {
    return `${symbol} ${formatNumber(amount, 'es')}`;
  }

  // For USD and others, use a cleaner format
  // We force en-US formatting for USD if the user wants standard US format,
  // or we keep it localized but ensure it looks premium.
  const formatted = amount.toLocaleString(
    language === 'es' ? 'es-ES' : 'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );

  return `${symbol} ${formatted}`;
};
