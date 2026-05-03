import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {
  Card,
  FAB,
  IconButton,
  List,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Category,
  TransactionType,
  useStore,
  useTranslation,
} from '../store/useStore';

export const CategoriesScreen = () => {
  const { categories, deleteCategory, transactions, updateCategoriesOrder } =
    useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');

  const handleDelete = (category: Category) => {
    const isUsed = transactions.some((t) => t.categoryId === category.id);
    if (isUsed) {
      Alert.alert(t('cannotDelete'), t('categoryUsedError'));
      return;
    }

    Alert.alert(
      t('deleteCategory'),
      `${t('confirmDelete')} ${translateName(category.name)}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteCategory(category.id),
        },
      ],
    );
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Category>) => (
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
            pathname: '/add-category',
            params: { category: JSON.stringify(item) },
          })
        }
        onLongPress={drag}
        disabled={isActive}
        mode="elevated"
      >
        <List.Item
          title={translateName(item.name)}
          titleStyle={styles.categoryName}
          left={() => (
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: item.color || theme.colors.surfaceVariant },
              ]}
            >
              <MaterialCommunityIcons
                name={(item.icon as any) || 'tag'}
                size={22}
                color="#fff"
              />
            </View>
          )}
          right={(props) => (
            <IconButton
              {...props}
              icon="trash-can-outline"
              iconColor={theme.colors.error}
              onPress={() => handleDelete(item)}
            />
          )}
        />
      </Card>
    </ScaleDecorator>
  );

  const insets = useSafeAreaInsets();

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TransactionType)}
          buttons={[
            {
              value: 'expense',
              label: t('expenses'),
              icon: 'minus-circle-outline',
            },
            {
              value: 'income',
              label: t('income'),
              icon: 'plus-circle-outline',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <DraggableFlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          // Merge reordered filtered list back into the main categories list
          const otherCategories = categories.filter(
            (c) => c.type !== activeTab,
          );
          updateCategoriesOrder([...data, ...otherCategories]);
        }}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={activeTab === 'expense' ? 'cart-outline' : 'cash-outline'}
              size={64}
              color={theme.colors.outlineVariant}
            />
            <Text
              variant="bodyLarge"
              style={[styles.emptyText, { color: theme.colors.outline }]}
            >
              {t('noCategories')}
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: (insets.bottom || 0) + 80,
            backgroundColor: theme.colors.primary,
          },
        ]}
        color="#fff"
        onPress={() => router.push('/add-category')}
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    topBar: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.background,
    },
    segmentedButtons: {
      borderRadius: 12,
    },
    listContent: {
      paddingTop: 4,
    },
    card: {
      marginBottom: 8,
      marginHorizontal: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      alignSelf: 'center',
    },
    categoryName: {
      fontWeight: '700',
      fontSize: 16,
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 80,
    },
    emptyText: {
      textAlign: 'center',
      paddingHorizontal: 20,
      marginTop: 12,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 20,
      elevation: 4,
    },
  });
