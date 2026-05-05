import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Card, FAB, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { Goal, useStore, useTranslation } from '../store/useStore';
import { getValidGoalIcon } from '../constants';

export const GoalsScreen = () => {
  const { goals, formatCurrency, updateGoalsOrder } = useStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = defaultStyles(theme);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Goal>) => {
    const progress =
      item.targetAmount > 0
        ? Math.min((item.currentAmount / item.targetAmount) * 100, 100)
        : 0;

    return (
      <ScaleDecorator>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: isActive
                ? theme.colors.elevation.level3
                : theme.colors.surface,
            },
          ]}
          onPress={() =>
            router.push({
              pathname: '/goal-detail',
              params: { goalId: item.id },
            })
          }
          onLongPress={drag}
          disabled={isActive}
          mode="elevated"
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.color || theme.colors.primary },
                ]}
              >
                <Ionicons
                  name={getValidGoalIcon(item.icon) as any}
                  size={24}
                  color="#fff"
                />
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" style={styles.name}>
                  {item.name}
                </Text>
                <Text
                  variant="labelMedium"
                  style={[styles.amountText, { color: theme.colors.outline }]}
                >
                  {formatCurrency(item.currentAmount)} /{' '}
                  {formatCurrency(item.targetAmount)}
                </Text>
              </View>
              <View style={styles.percentageContainer}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.percentageText,
                    { color: item.color || theme.colors.primary },
                  ]}
                >
                  {Math.round(progress)}%
                </Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <ProgressBar
                progress={progress / 100}
                color={item.color || theme.colors.primary}
                style={styles.progressBar}
              />
              {item.deadline && (
                <View style={styles.deadlineRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={theme.colors.outline}
                  />
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.deadlineText,
                      { color: theme.colors.outline },
                    ]}
                  >
                    {new Date(item.deadline).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScaleDecorator>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DraggableFlatList
        data={goals}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => updateGoalsOrder(data)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text
              variant="bodyLarge"
              style={[styles.emptySubtitle, { color: theme.colors.outline }]}
            >
              {t('noGoalsSubtitle') ||
                'Set your first financial goal and start saving today!'}
            </Text>
          </View>
        }
      />

      <BannerAdComponent />

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: (insets.bottom || 0) + 120,
            backgroundColor: theme.colors.primary,
          },
        ]}
        color="#fff"
        onPress={() => router.push('/add-goal')}
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      padding: 16,
    },
    card: {
      marginBottom: 16,
      borderRadius: 16,
      overflow: 'hidden',
    },
    cardContent: {
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    textContainer: {
      flex: 1,
    },
    name: {
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    amountText: {
      marginTop: 2,
      fontWeight: '500',
    },
    percentageContainer: {
      alignItems: 'flex-end',
    },
    percentageText: {
      fontWeight: '800',
    },
    progressSection: {
      marginTop: 4,
    },
    progressBar: {
      height: 10,
      borderRadius: 5,
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
    deadlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    deadlineText: {
      marginLeft: 4,
      fontWeight: '500',
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 80,
    },
    emptyIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
      elevation: 6,
    },
  });
