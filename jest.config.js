module.exports = {
  preset: 'jest-expo',
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/utils/**/*.{ts,tsx}',
    'src/constants/**/*.{ts,tsx}',
    'src/i18n/**/*.{ts,tsx}',
    'src/features/insights/services/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    'src/store/**/*.{ts,tsx}',
    'src/ads/**/*.{ts,tsx}',
    'src/theme/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    '!src/**/types/**',
    '!src/utils/widgetUpdater.tsx',
    '!src/db/schema.ts',
  ],
  coverageReporters: ['text', 'lcov', 'text-summary'],
};
