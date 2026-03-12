import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { interstitialManager } from './src/ads/InterstitialManager';
import { initDb } from './src/database/schema';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const { loadData, isLoaded, language } = useStore();

  useEffect(() => {
    const setup = async () => {
      try {
        await mobileAds().initialize();
        interstitialManager.init();
        initDb();
        setDbInitialized(true);
      } catch (e) {
        console.error('Failed to initialize local DB or Ads', e);
      }
    };
    setup();
  }, []);

  useEffect(() => {
    if (dbInitialized && !isLoaded) {
      loadData();
    }
  }, [dbInitialized, isLoaded, loadData]);

  if (!dbInitialized || !isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}
