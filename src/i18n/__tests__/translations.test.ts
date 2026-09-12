import {
  getTranslatedName,
  nameToKeyMapping,
  translations,
} from '../translations';
import { en } from '../en';
import { es } from '../es';

describe('translations', () => {
  it('contains valid translation dictionaries for en and es', () => {
    expect(translations.en).toBeDefined();
    expect(translations.es).toBeDefined();
    expect(typeof translations.en.dashboard).toBe('string');
    expect(typeof translations.es.dashboard).toBe('string');
  });

  it('has consistent key sets between English and Spanish', () => {
    const enKeys = Object.keys(en).sort();
    const esKeys = Object.keys(es).sort();
    expect(enKeys).toEqual(esKeys);
  });

  describe('nameToKeyMapping', () => {
    it('maps default category and account names to translation keys', () => {
      expect(nameToKeyMapping['Food']).toBe('catFood');
      expect(nameToKeyMapping['Alimentación']).toBe('catFood');
      expect(nameToKeyMapping['Transport']).toBe('catTransport');
      expect(nameToKeyMapping['Bank']).toBe('defaultAccountName');
      expect(nameToKeyMapping['Balance Adjustment']).toBe('balanceAdjustment');
    });
  });

  describe('getTranslatedName', () => {
    it('translates known category names to Spanish', () => {
      const translated = getTranslatedName('Food', 'es');
      expect(translated).toBe(es.catFood);
    });

    it('translates known category names to English', () => {
      const translated = getTranslatedName('Alimentación', 'en');
      expect(translated).toBe(en.catFood);
    });

    it('returns original name if not in nameToKeyMapping', () => {
      expect(getTranslatedName('My Custom Category', 'es')).toBe(
        'My Custom Category',
      );
    });

    it('falls back to translations.en when language is unsupported', () => {
      const translated = getTranslatedName('Food', 'fr' as any);
      expect(translated).toBe(en.catFood);
    });

    it('falls back to name if key is missing in translation dict', () => {
      // Temporarily set a key mapping that does not exist in translations
      nameToKeyMapping['FakeCategory'] = 'nonExistentKey';
      expect(getTranslatedName('FakeCategory', 'en')).toBe('FakeCategory');
      delete nameToKeyMapping['FakeCategory'];
    });
  });
});
