import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { useStore, useTranslation } from '../store/useStore';

// Lazy load non-essential screens
const AccountsScreen = lazy(() =>
  import('../screens/AccountsScreen').then((m) => ({
    default: m.AccountsScreen,
  })),
);
const AddAccountScreen = lazy(() =>
  import('../screens/AddAccountScreen').then((m) => ({
    default: m.AddAccountScreen,
  })),
);
const AddBudgetScreen = lazy(() =>
  import('../screens/AddBudgetScreen').then((m) => ({
    default: m.AddBudgetScreen,
  })),
);
const AddCategoryScreen = lazy(() =>
  import('../screens/AddCategoryScreen').then((m) => ({
    default: m.AddCategoryScreen,
  })),
);
const AddTransactionScreen = lazy(() =>
  import('../screens/AddTransactionScreen').then((m) => ({
    default: m.AddTransactionScreen,
  })),
);
const BudgetsScreen = lazy(() =>
  import('../screens/BudgetsScreen').then((m) => ({
    default: m.BudgetsScreen,
  })),
);
const CategoriesScreen = lazy(() =>
  import('../screens/CategoriesScreen').then((m) => ({
    default: m.CategoriesScreen,
  })),
);
const InsightsScreen = lazy(() =>
  import('../screens/InsightsScreen').then((m) => ({
    default: m.InsightsScreen,
  })),
);
const SettingsScreen = lazy(() =>
  import('../screens/SettingsScreen').then((m) => ({
    default: m.SettingsScreen,
  })),
);
const TransactionsScreen = lazy(() =>
  import('../screens/TransactionsScreen').then((m) => ({
    default: m.TransactionsScreen,
  })),
);
const CalendarScreen = lazy(() =>
  import('../screens/CalendarScreen').then((m) => ({
    default: m.CalendarScreen,
  })),
);
const GoalsScreen = lazy(() =>
  import('../screens/GoalsScreen').then((m) => ({ default: m.GoalsScreen })),
);
const AddGoalScreen = lazy(() =>
  import('../screens/AddGoalScreen').then((m) => ({
    default: m.AddGoalScreen,
  })),
);
const GoalDetailScreen = lazy(() =>
  import('../screens/GoalDetailScreen').then((m) => ({
    default: m.GoalDetailScreen,
  })),
);
const AboutScreen = lazy(() =>
  import('../screens/AboutScreen').then((m) => ({ default: m.AboutScreen })),
);
const PrivacyPolicyScreen = lazy(() =>
  import('../screens/PrivacyPolicyScreen').then((m) => ({
    default: m.PrivacyPolicyScreen,
  })),
);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const LoadingFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="small" color="#2196f3" />
  </View>
);

const withSuspense = (Component: any) => (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component {...props} />
  </Suspense>
);

const TabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Transactions') iconName = 'list';
          else if (route.name === 'Insights') iconName = 'bulb';
          else if (route.name === 'Settings') iconName = 'settings';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196f3',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: t('dashboard') }}
      />
      <Tab.Screen
        name="Transactions"
        component={withSuspense(TransactionsScreen)}
        options={{ title: t('transactions') }}
      />
      <Tab.Screen
        name="Insights"
        component={withSuspense(InsightsScreen)}
        options={{ title: t('insights') }}
      />
      <Tab.Screen
        name="Settings"
        component={withSuspense(SettingsScreen)}
        options={{ title: t('settings') }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTransaction"
        component={withSuspense(AddTransactionScreen)}
        options={{ title: t('addTransaction'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddAccount"
        component={withSuspense(AddAccountScreen)}
        options={{ title: t('addAccount'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddCategory"
        component={withSuspense(AddCategoryScreen)}
        options={{ title: t('addCategory'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddBudget"
        component={withSuspense(AddBudgetScreen)}
        options={{ title: t('addBudget'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="Accounts"
        component={withSuspense(AccountsScreen)}
        options={{ title: t('manageAccounts') }}
      />
      <Stack.Screen
        name="Categories"
        component={withSuspense(CategoriesScreen)}
        options={{ title: t('manageCategories') }}
      />
      <Stack.Screen
        name="Budgets"
        component={withSuspense(BudgetsScreen)}
        options={{ title: t('manageBudgets') }}
      />
      <Stack.Screen
        name="Calendar"
        component={withSuspense(CalendarScreen)}
        options={{ title: t('calendar') }}
      />
      <Stack.Screen
        name="Goals"
        component={withSuspense(GoalsScreen)}
        options={{ title: t('goals') }}
      />
      <Stack.Screen
        name="AddGoal"
        component={withSuspense(AddGoalScreen)}
        options={{ title: t('addGoal'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="GoalDetail"
        component={withSuspense(GoalDetailScreen)}
        options={{ title: t('goalDetail') || 'Goal Details' }}
      />
      <Stack.Screen
        name="About"
        component={withSuspense(AboutScreen)}
        options={{ title: t('aboutApp') }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={withSuspense(PrivacyPolicyScreen)}
        options={{ title: t('privacyPolicy') }}
      />
    </Stack.Navigator>
  );
};
