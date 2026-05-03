import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/store/useStore';

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const currentTab = segments[segments.length - 1];
  const showFAB =
    currentTab === '(tabs)' ||
    currentTab === 'index' ||
    currentTab === 'transactions';

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.elevation.level1,
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          headerStyle: {
            backgroundColor: theme.colors.elevation.level1,
          },
          headerTintColor: theme.colors.onSurface,
          headerShown: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('dashboard'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: t('transactions'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: t('insights'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bulb" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('settings') || 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {showFAB && (
        <FAB
          icon="plus"
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
              bottom: insets.bottom + 70,
            },
          ]}
          color="white"
          onPress={() => router.push('/add-transaction')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    borderRadius: 28,
    elevation: 6,
  },
});
