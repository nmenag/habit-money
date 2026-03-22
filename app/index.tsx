import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getDb } from '../src/db/schema';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [firstLaunch, setFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const db = getDb();
        // The table is created by initDb which runs in _layout.tsx
        const row = db.getFirstSync<{ val: string }>(
          "SELECT val FROM settings WHERE id = 'isFirstLaunch'",
        );

        if (row && row.val === 'false') {
          setFirstLaunch(false);
        } else {
          // If no row found or it's not 'false', then it's the first launch
          setFirstLaunch(true);
        }
      } catch (e) {
        console.warn('DB error checking first launch:', e);
        setFirstLaunch(true);
      } finally {
        setLoading(false);
      }
    };
    checkFirstLaunch();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (firstLaunch) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
