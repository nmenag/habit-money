import { AD_UNIT_IDS, DEV_AD_UNIT_IDS, AdService } from '../AdService';

describe('AdService', () => {
  it('exports valid DEV_AD_UNIT_IDS', () => {
    expect(DEV_AD_UNIT_IDS.BANNER).toBe('test-banner');
    expect(DEV_AD_UNIT_IDS.INTERSTITIAL).toBe('test-interstitial');
  });

  it('exports AD_UNIT_IDS with fallback or platform values', () => {
    expect(AD_UNIT_IDS.BANNER).toBeDefined();
    expect(AD_UNIT_IDS.INTERSTITIAL).toBeDefined();
  });

  it('returns DEV banner ID in development environment', () => {
    const bannerId = AdService.getBannerId();
    expect(bannerId).toBe(DEV_AD_UNIT_IDS.BANNER);
  });
});
