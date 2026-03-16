import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AccountsScreen } from '../screens/AccountsScreen';
import { AddAccountScreen } from '../screens/AddAccountScreen';
import { AddBudgetScreen } from '../screens/AddBudgetScreen';
import { AddCategoryScreen } from '../screens/AddCategoryScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { AddGoalScreen } from '../screens/AddGoalScreen';
import { GoalDetailScreen } from '../screens/GoalDetailScreen';
import { useStore, useTranslation } from '../store/useStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
        component={TransactionsScreen}
        options={{ title: t('transactions') }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ title: t('insights') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
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
        component={AddTransactionScreen}
        options={{ title: t('addTransaction'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddAccount"
        component={AddAccountScreen}
        options={{ title: t('addAccount'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddCategory"
        component={AddCategoryScreen}
        options={{ title: t('addCategory'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddBudget"
        component={AddBudgetScreen}
        options={{ title: t('addBudget'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{ title: t('manageAccounts') }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: t('manageCategories') }}
      />
      <Stack.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{ title: t('manageBudgets') }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: t('calendar') }}
      />
      <Stack.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ title: t('goals') }}
      />
      <Stack.Screen
        name="AddGoal"
        component={AddGoalScreen}
        options={{ title: t('addGoal'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="GoalDetail"
        component={GoalDetailScreen}
        options={{ title: t('goalDetail') || 'Goal Details' }}
      />
    </Stack.Navigator>
  );
};
