import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, SectionList, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Card,
  FAB,
  IconButton,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category, useStore, useTranslation } from '../store/useStore';

export const CategoriesScreen = ({ navigation }: any) => {
  const { categories, deleteCategory, transactions } = useStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);

  const handleDelete = (category: Category) => {
    const isUsed = transactions.some((t) => t.categoryId === category.id);
    if (isUsed) {
      Alert.alert(t('cannotDelete'), t('categoryUsedError'));
      return;
    }

    Alert.alert(
      t('deleteCategory'),
      `${t('confirmDelete')} ${category.name}?`,
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

  const renderItem = ({ item }: { item: Category }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('AddCategory', { category: item })}
      mode="elevated"
    >
      <List.Item
        title={item.name}
        titleStyle={styles.categoryName}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon={(item.icon as any) || 'folder'}
            size={44}
            style={{
              backgroundColor: item.color || theme.colors.surfaceVariant,
            }}
            color="#fff"
          />
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
  );

  const insets = useSafeAreaInsets();

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const sections = [
    { title: t('expenses'), data: expenseCategories },
    { title: t('income'), data: incomeCategories },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title, data } }) =>
          data.length > 0 ? (
            <View style={styles.header}>
              <Text variant="labelLarge" style={styles.headerTitle}>
                {title}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {t('noCategories')}
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: (insets.bottom || 0) + 80 }]}
        onPress={() => navigation.navigate('AddCategory')}
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
      paddingTop: 8,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerTitle: {
      fontWeight: '900',
      color: theme.colors.onSurface,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    card: {
      marginBottom: 8,
      marginHorizontal: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    categoryName: {
      fontWeight: '700',
      fontSize: 16,
    },
    empty: {
      padding: 60,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
    },
  });
