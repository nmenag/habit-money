import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
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
} from '../../../store/useStore';
import {
  CATEGORY_ICONS as ICONS,
  COLORS,
  getValidCategoryIcon,
} from '../../../constants';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { AppTheme } from '../../../theme/theme';

export const AddCategoryScreen = () => {
  const params = useLocalSearchParams<{ category?: string }>();

  const editingCategory = useMemo(() => {
    if (params.category) {
      try {
        return JSON.parse(params.category) as Category;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [params.category]);

  const isEditing = !!editingCategory;

  const { addCategory, editCategory, deleteCategory, transactions } =
    useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const [menuOpen, setMenuOpen] = useState(false);

  const [name, setName] = useState(
    editingCategory ? translateName(editingCategory.name) : '',
  );
  const [type, setType] = useState<TransactionType>(
    editingCategory?.type || 'expense',
  );
  const [color, setColor] = useState(editingCategory?.color || COLORS[0]);
  const [icon, setIcon] = useState(getValidCategoryIcon(editingCategory?.icon));

  const isNameValid = name.trim().length >= 2;

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

  const handleDelete = () => {
    if (!editingCategory) return;
    const isUsed = transactions.some(
      (t) => t.categoryId === editingCategory.id,
    );
    if (isUsed) {
      Alert.alert(t('cannotDelete'), t('categoryUsedError'));
      return;
    }

    Alert.alert(
      t('deleteCategory'),
      `${t('confirmDelete')} ${translateName(editingCategory.name)}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteCategory(editingCategory.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          title: isEditing ? t('updateCategory') : t('saveCategory'),
          headerRight: () =>
            isEditing ? (
              <TouchableOpacity
                onPress={() => setMenuOpen(true)}
                style={{ padding: 8, marginRight: -8 }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={22}
                  color={theme.colors.onSurface}
                />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
            {t('categoryName')}
          </Text>
          <TextInput
            placeholder={t('categoryNamePlaceholder')}
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.inputField}
            outlineColor={theme.dark ? '#27272A' : '#E4E4E7'}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            placeholderTextColor={theme.colors.outline}
            maxLength={30}
          />
          {name.length > 0 && !isNameValid && (
            <Text
              style={{
                color: theme.colors.error,
                fontSize: 11,
                marginTop: 4,
                fontWeight: '500',
              }}
            >
              {t('nameMinLengthError')}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.outline, marginBottom: 8 },
            ]}
          >
            {t('categoryType') || 'TRANSACTION TYPE'}
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
          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.outline, marginBottom: 12 },
            ]}
          >
            {t('color') || 'THEME COLOR'}
          </Text>
          <View style={styles.colorGrid}>
            {COLORS.map((c) => {
              const isActiveColor = color === c;
              return (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.8}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: c,
                      borderColor: isActiveColor
                        ? theme.colors.primary
                        : 'transparent',
                      borderWidth: isActiveColor ? 3.5 : 0,
                    },
                  ]}
                  onPress={() => setColor(c)}
                >
                  {isActiveColor && (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color="#fff"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.outline, marginBottom: 12 },
            ]}
          >
            {t('icon') || 'CATEGORY ICON'}
          </Text>
          <View style={styles.iconGrid}>
            {ICONS.map((i) => {
              const isActiveIcon = icon === i;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isActiveIcon
                        ? `${color}1A`
                        : theme.colors.elevation.level1,
                      borderColor: isActiveIcon
                        ? color
                        : theme.colors.outlineVariant,
                      borderWidth: isActiveIcon ? 2 : 1,
                    },
                  ]}
                  onPress={() => setIcon(i)}
                >
                  <MaterialCommunityIcons
                    name={i as any}
                    size={22}
                    color={isActiveIcon ? color : theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!isNameValid}
          style={[
            styles.saveBtn,
            {
              backgroundColor: isNameValid
                ? color
                : theme.colors.outlineVariant,
            },
          ]}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
        >
          {isEditing ? t('updateCategory') : t('saveCategory')}
        </Button>
      </ScrollView>

      <BannerAdComponent />

      <BottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('categoryOptions')}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              handleDelete();
            }}
            accessibilityRole="button"
            accessibilityLabel={t('delete') || 'Delete category'}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={theme.colors.error}
              style={{ marginRight: 16 }}
            />
            <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
              {t('delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    content: {
      padding: 16,
      gap: 24,
    },
    fieldContainer: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: '500',
      letterSpacing: 1.5,
      paddingLeft: 4,
      textTransform: 'uppercase',
    },
    inputField: {
      fontSize: 15,
      fontWeight: '500',
      backgroundColor: 'transparent',
    },
    section: {},
    segmentedButtons: {
      borderRadius: 14,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'flex-start',
      paddingLeft: 4,
    },
    colorCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'flex-start',
      paddingLeft: 4,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtn: {
      borderRadius: 16,
      marginTop: 8,
    },
    btnContent: {
      height: 52,
    },
    btnLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
    },
    menuContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderRadius: 16,
      marginVertical: 2,
    },
    menuItemText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
