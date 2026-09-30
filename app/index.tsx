import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useStore } from '../src/store/useStore';

export default function Index() {
  const isLoaded = useStore((state) => state.isLoaded);
  const isFirstLaunch = useStore((state) => state.isFirstLaunch);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isFirstLaunch) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
