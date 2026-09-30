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
    EUR: '€',
    GBP: '£',
    MXN: '$',
    COP: '$',
    PEN: 'S/',
    CLP: '$',
    CAD: '$',
    AUD: '$',
    NZD: '$',
    ARS: '$',
    BOB: 'Bs.',
    CRC: '₡',
    CUP: '$',
    DOP: 'RD$',
    GTQ: 'Q',
    HNL: 'L',
    NIO: 'C$',
    PYG: '₲',
    UYU: '$U',
    VES: 'Bs.S',
    XAF: 'FCFA',
    INR: '₹',
    ZAR: 'R',
    SGD: 'S$',
    PHP: '₱',
    NGN: '₦',
    PKR: '₨',
    JMD: 'J$',
    BSD: 'B$',
    TTD: 'TT$',
    BZD: 'BZ$',
    BBD: 'Bds$',
    KES: 'KSh',
    GHS: '₵',
  };
  const symbol = symbols[currencyCode] || '$';

  const isNoDecimal =
    currencyCode === 'COP' ||
    currencyCode === 'CLP' ||
    currencyCode === 'PYG' ||
    currencyCode === 'XAF';

  if (isNoDecimal) {
    return `${symbol} ${formatNumber(amount, language)}`;
  }

  const formatted = amount.toLocaleString(
    language === 'es' ? 'es-ES' : 'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );

  return `${symbol} ${formatted}`;
};
