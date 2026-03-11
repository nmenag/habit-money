import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Category, useStore } from '../store/useStore';

export const CategoriesScreen = ({ navigation }: any) => {
  const categories = useStore((state) => state.categories);
  const deleteCategory = useStore((state) => state.deleteCategory);
  const transactions = useStore((state) => state.transactions);

  const handleDelete = (category: Category) => {
    const isUsed = transactions.some((t) => t.categoryId === category.id);
    if (isUsed) {
      Alert.alert(
        'Cannot Delete',
        'This category is used in one or more transactions.',
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete ${category.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(category.id),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AddCategory', { category: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: item.color || '#ccc' },
          ]}
        >
          <Ionicons
            name={(item.icon as any) || 'list'}
            size={24}
            color="#fff"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.type}>{item.type.toUpperCase()}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={24} color="#f44336" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No categories found.</Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddCategory')}
        >
          <Text style={styles.addButtonText}>Add Category</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  type: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  addButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
