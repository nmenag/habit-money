import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Category,
  TransactionType,
  useStore,
  useTranslation,
} from '../store/useStore';

const COLORS = [
  // Flat Colors
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#9e9e9e', // Grey
  '#607d8b', // Blue Grey
  // Premium / Deep
  '#1a1a1a', // Black
  '#d32f2f', // Dark Red
  '#c2185b', // Dark Pink
  '#7b1fa2', // Dark Purple
  '#512da8', // Dark Deep Purple
  '#303f9f', // Dark Indigo
  '#1976d2', // Dark Blue
  '#0288d1', // Dark Light Blue
  '#0097a7', // Dark Cyan
  '#00796b', // Dark Teal
  '#388e3c', // Dark Green
  '#689f38', // Dark Light Green
  '#afb42b', // Dark Lime
  '#fbc02d', // Dark Yellow
  '#ffa000', // Dark Amber
  '#f57c00', // Dark Orange
  '#e64a19', // Dark Deep Orange
  '#5d4037', // Dark Brown
  '#455a64', // Dark Blue Grey
];

const ICONS = [
  // Common
  'food',
  'car',
  'bus',
  'subway',
  'bicycle',
  'home',
  'home-city',
  'controller-classic',
  'medical-bag',
  'format-list-bulleted',
  'cash',
  'wallet',
  'piggy-bank',
  'bank',
  'bank-transfer',
  'credit-card',
  'cart',
  'airplane',
  'briefcase',
  'school',
  'tshirt-crew',
  'coffee',
  'dumbbell',
  'music-note',
  'chart-line',
  'trending-up',
  // Food & Drink
  'pizza',
  'fast-food',
  'food-apple',
  'beer',
  'glass-wine',
  'ice-cream',
  // Services
  'gas-station',
  'movie-open',
  'ticket',
  'laptop',
  'cellphone',
  'television',
  'newspaper',
  'book-open-variant',
  // Life
  'gift',
  'heart',
  'star',
  'church',
  'paw',
  'dog',
  'cat',
  'baby-carriage',
  'stroller',
  // Home
  'lightbulb',
  'water',
  'shield-home',
  'hammer',
  'wrench',
  'brush',
  'camera',
  // Tech/Entertainment
  'amazon',
  'netflix',
  'spotify',
  'google-play',
  'apple',
  'github',
  'xbox',
  'playstation',
  'steam',
];

export const AddCategoryScreen = () => {
  const params = useLocalSearchParams<{ category?: string }>();

  const editingCategory = useMemo(() => {
    if (params.category) {
      try {
        return JSON.parse(params.category) as Category;
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }, [params.category]);

  const isEditing = !!editingCategory;

  const { addCategory, editCategory } = useStore();
  const { t } = useTranslation();
  const theme = useTheme();

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

    if (isEditing && editingCategory) {
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
        displayOrder: 0,
      });
    }

    router.back();
  };

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
      >
        <TextInput
          label={t('categoryName')}
          placeholder={t('categoryNamePlaceholder')}
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.textInput}
          outlineStyle={styles.inputOutline}
        />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('categoryType')}
          </Text>
          <SegmentedButtons
            value={type}
            onValueChange={(v) => setType(v as TransactionType)}
            buttons={[
              { value: 'expense', label: t('expense') },
              { value: 'income', label: t('income') },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('icon')}
          </Text>
          <View style={styles.iconContainer}>
            {ICONS.map((i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.iconBox,
                  {
                    backgroundColor:
                      icon === i ? color : theme.colors.surfaceVariant,
                  },
                ]}
                onPress={() => setIcon(i)}
              >
                <MaterialCommunityIcons
                  name={i as any}
                  size={24}
                  color={icon === i ? '#fff' : theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('color')}
          </Text>
          <View style={styles.colorContainer}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  color === c && {
                    borderColor: theme.colors.primary,
                    borderWidth: 3,
                  },
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && (
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
          labelStyle={styles.saveBtnLabel}
        >
          {isEditing ? t('updateCategory') : t('saveCategory')}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  textInput: {
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  inputOutline: {
    borderRadius: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
  },
  segmentedButtons: {
    borderRadius: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    borderRadius: 20,
    marginTop: 32,
    elevation: 2,
  },
  saveBtnContent: {
    height: 56,
  },
  saveBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
