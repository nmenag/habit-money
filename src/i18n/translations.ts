import { en } from './en';
import { es } from './es';

export type Language = 'en' | 'es';
export type TranslationKeys = typeof en;

export const nameToKeyMapping: Record<string, string> = {
  Food: 'catFood',
  Alimentación: 'catFood',
  Transport: 'catTransport',
  Transporte: 'catTransport',
  Housing: 'catHousing',
  Vivienda: 'catHousing',
  Entertainment: 'catEntertainment',
  Entretenimiento: 'catEntertainment',
  Health: 'catHealth',
  Salud: 'catHealth',
  Other: 'catOther',
  Otros: 'catOther',
  Salary: 'catSalary',
  Salario: 'catSalary',
  'Other Income': 'catOtherIncome',
  'Otros Ingresos': 'catOtherIncome',
  Investments: 'catInvestments',
  Inversiones: 'catInvestments',
  Gifts: 'catGifts',
  Regalos: 'catGifts',
  Rent: 'catRent',
  Arriendo: 'catRent',
  'Bills & Taxes': 'catBills',
  'Facturas e Impuestos': 'catBills',
  Bank: 'defaultAccountName',
  Banco: 'defaultAccountName',
  Main: 'defaultAccountName',
  'Balance Adjustment': 'balanceAdjustment',
  'Ajuste de Saldo': 'balanceAdjustment',
};

export const translations: Record<Language, TranslationKeys> = {
  en,
  es,
};

export const getTranslatedName = (name: string, lang: Language) => {
  const key = nameToKeyMapping[name];
  if (key) {
    const langSet = translations[lang] || translations.en;
    return (langSet as any)[key] || name;
  }
  return name;
};
