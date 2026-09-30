import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_KEY = 'app_lock_enabled';

export const AppLockService = {
  getAppLockEnabled: async (): Promise<boolean> => {
    try {
      const value = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  },

  setAppLockEnabled: async (enabled: boolean): Promise<void> => {
    try {
      await SecureStore.setItemAsync(SECURE_STORE_KEY, String(enabled));
    } catch (e) {
      console.warn('AppLockService: failed to persist lock preference', e);
    }
  },

  checkHardwareSupport: async (): Promise<{
    hasHardware: boolean;
    isEnrolled: boolean;
  }> => {
    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      return { hasHardware, isEnrolled };
    } catch {
      return { hasHardware: false, isEnrolled: false };
    }
  },

  authenticate:
    async (): Promise<LocalAuthentication.LocalAuthenticationResult> => {
      try {
        return await LocalAuthentication.authenticateAsync({
          disableDeviceFallback: false,
          cancelLabel: 'Cancel',
        });
      } catch {
        return { success: false, error: 'unknown' };
      }
    },
};
