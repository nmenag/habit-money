import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppLockService } from '../AppLockService';

describe('AppLockService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAppLockEnabled', () => {
    it('returns true when stored value is "true"', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('true');
      expect(await AppLockService.getAppLockEnabled()).toBe(true);
    });

    it('returns false when stored value is "false" or null', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('false');
      expect(await AppLockService.getAppLockEnabled()).toBe(false);

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      expect(await AppLockService.getAppLockEnabled()).toBe(false);
    });

    it('returns false when SecureStore throws an error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Keystore error'),
      );
      expect(await AppLockService.getAppLockEnabled()).toBe(false);
    });
  });

  describe('setAppLockEnabled', () => {
    it('stores the boolean preference as a string in SecureStore', async () => {
      await AppLockService.setAppLockEnabled(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'app_lock_enabled',
        'true',
      );

      await AppLockService.setAppLockEnabled(false);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'app_lock_enabled',
        'false',
      );
    });

    it('handles and logs SecureStore write failure', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Write failed'),
      );
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await AppLockService.setAppLockEnabled(true);
      expect(warnSpy).toHaveBeenCalledWith(
        'AppLockService: failed to persist lock preference',
        expect.any(Error),
      );
      warnSpy.mockRestore();
    });
  });

  describe('checkHardwareSupport', () => {
    it('returns hardware and enrollment status', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(
        true,
      );
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(
        true,
      );

      const status = await AppLockService.checkHardwareSupport();
      expect(status).toEqual({ hasHardware: true, isEnrolled: true });
    });

    it('returns fallback false values when detection fails', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Hardware check failed'),
      );

      const status = await AppLockService.checkHardwareSupport();
      expect(status).toEqual({ hasHardware: false, isEnrolled: false });
    });
  });

  describe('authenticate', () => {
    it('delegates to LocalAuthentication.authenticateAsync', async () => {
      (
        LocalAuthentication.authenticateAsync as jest.Mock
      ).mockResolvedValueOnce({ success: true });

      const result = await AppLockService.authenticate();
      expect(result).toEqual({ success: true });
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
    });

    it('returns failure result if authentication throws an exception', async () => {
      (
        LocalAuthentication.authenticateAsync as jest.Mock
      ).mockRejectedValueOnce(new Error('Biometrics cancelled'));

      const result = await AppLockService.authenticate();
      expect(result).toEqual({ success: false, error: 'unknown' });
    });
  });
});
