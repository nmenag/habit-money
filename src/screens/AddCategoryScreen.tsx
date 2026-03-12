import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category, TransactionType, useStore, useTranslation } from '../store/useStore';

const COLORS = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#ff9800',
  '#795548',
  '#607d8b',
];
const ICONS = [
  'fast-food',
  'car',
  'home',
  'game-controller',
  'medkit',
  'list',
  'cash',
  'wallet',
  'cart',
  'airplane',
  'business',
  'school',
  'shirt',
  'cafe',
  'fitness',
  'musical-notes',
];

export const AddCategoryScreen = ({ route, navigation }: any) => {
  const editingCategory = route.params?.category as Category | undefined;
  const isEditing = !!editingCategory;

  const { addCategory, editCategory } = useStore();
  const { t, language } = useTranslation();

  const [name, setName] = useState(editingCategory?.name || '');
  const [type, setType] = useState<TransactionType>(
    editingCategory?.type || 'expense',
  );
  const [color, setColor] = useState(editingCategory?.color || COLORS[0]);
  const [icon, setIcon] = useState(editingCategory?.icon || ICONS[0]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('enterCategoryName'));
      return;
    }

    if (isEditing) {
      editCategory({
        ...editingCategory,
        name: name.trim(),
        type: type,
        color: color,
        icon: icon,
      });
    } else {
      addCategory({
        id: Date.now().toString(),
        name: name.trim(),
        type: type,
        color: color,
        icon: icon,
      });
    }

    navigation.goBack();
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('categoryName')}</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Groceries"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('categoryType')}</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.activeTypeBtn]}
            onPress={() => setType('expense')}
          >
            <Text
              style={[
                styles.typeText,
                type === 'expense' && styles.activeTypeText,
              ]}
            >
              {t('expense')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.activeTypeBtn]}
            onPress={() => setType('income')}
          >
            <Text
              style={[
                styles.typeText,
                type === 'income' && styles.activeTypeText,
              ]}
            >
              {t('income')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('icon')}</Text>
        <View style={styles.iconContainer}>
          {ICONS.map((i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.iconBox,
                { backgroundColor: icon === i ? color : '#f0f0f0' },
              ]}
              onPress={() => setIcon(i)}
            >
              <Ionicons
                name={i as any}
                size={24}
                color={icon === i ? '#fff' : '#888'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('color')}</Text>
        <View style={styles.colorContainer}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                color === c && styles.activeColorCircle,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>
          {isEditing ? t('updateCategory') : t('saveCategory')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTypeBtn: {
    backgroundColor: '#2196f3',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeTypeText: {
    color: '#fff',
  },
  iconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColorCircle: {
    borderColor: '#333',
  },
  saveBtn: {
    backgroundColor: '#2196f3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
