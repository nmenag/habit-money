import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AccountsScreen } from '../screens/AccountsScreen';
import { AddAccountScreen } from '../screens/AddAccountScreen';
import { AddCategoryScreen } from '../screens/AddCategoryScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Transactions') iconName = 'list';
          else if (route.name === 'Accounts') iconName = 'wallet';
          else if (route.name === 'Categories') iconName = 'pricetags';
          else if (route.name === 'Insights') iconName = 'bulb';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196f3',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Accounts" component={AccountsScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
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
        options={{ title: 'Add Transaction', presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddAccount"
        component={AddAccountScreen}
        options={{ title: 'Add Account', presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddCategory"
        component={AddCategoryScreen}
        options={{ title: 'Add Category', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
};
