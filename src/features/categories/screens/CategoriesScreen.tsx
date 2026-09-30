import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Card, FAB, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import {
  Category,
  TransactionType,
  useStore,
  useTranslation,
} from '../../../store/useStore';
import { getValidCategoryIcon } from '../../../constants';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

export const CategoriesScreen = () => {
  const { categories, updateCategoriesOrder } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const insets = useSafeAreaInsets();

  const expenseCount = useMemo(
    () => categories.filter((c) => c.type === 'expense').length,
    [categories],
  );
  const incomeCount = useMemo(
    () => categories.filter((c) => c.type === 'income').length,
    [categories],
  );

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => c.type === activeTab)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [categories, activeTab]);

  const handleTabChange = useCallback(
    (newTab: TransactionType) => {
      if (newTab === activeTab) return;
      Haptics.selectionAsync().catch(() => {});
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActiveTab(newTab);
    },
    [activeTab],
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Category>) => {
    const itemColor = item.color || theme.colors.primary;

    const cardBg = isActive ? theme.colors.elevation.level3 : `${itemColor}12`;
    const cardBorder = isActive ? theme.colors.primary : `${itemColor}2B`;

    return (
      <ScaleDecorator>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
          onPress={() =>
            router.push({
              pathname: '/add-category',
              params: { category: JSON.stringify(item) },
            })
          }
          onLongPress={drag}
          delayLongPress={200}
          disabled={isActive}
          mode="contained"
        >
          <View style={styles.cardInner}>
            <TouchableOpacity
              onLongPress={drag}
              delayLongPress={150}
              style={styles.dragHandle}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={t('holdAndDragToReorder')}
              hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
            >
              <Ionicons
                name="reorder-two-outline"
                size={20}
                color={isActive ? theme.colors.primary : theme.colors.outline}
                style={{ opacity: isActive ? 1 : 0.6 }}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${itemColor}12`,
                  borderColor: `${itemColor}2B`,
                  borderWidth: 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getValidCategoryIcon(item.icon) as any}
                size={20}
                color={itemColor}
              />
            </View>

            <View style={styles.metaCol}>
              <Text
                style={[styles.categoryName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {translateName(item.name)}
              </Text>
            </View>
          </View>
        </Card>
      </ScaleDecorator>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('categories'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('back')}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.topControlSection}>
        <View
          style={[
            styles.menuTrack,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          {/* Expenses Tab */}
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'expense' && [
                styles.tabBtnActive,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  shadowOpacity: theme.dark ? 0.3 : 0.08,
                },
              ],
            ]}
            onPress={() => handleTabChange('expense')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'expense' }}
            accessibilityLabel={`${t('expenses')}, ${expenseCount} ${t('categories')}`}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name="arrow-down-circle"
                size={18}
                color={
                  activeTab === 'expense'
                    ? theme.colors.error || '#EF4444'
                    : theme.colors.outline
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === 'expense'
                        ? theme.colors.onSurface
                        : theme.colors.onSurfaceVariant,
                    fontFamily:
                      activeTab === 'expense'
                        ? 'Inter-SemiBold'
                        : 'Inter-Medium',
                    fontWeight: activeTab === 'expense' ? '600' : '500',
                  },
                ]}
              >
                {t('expenses')}
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  {
                    backgroundColor:
                      activeTab === 'expense'
                        ? theme.dark
                          ? 'rgba(239, 68, 68, 0.16)'
                          : '#FEE2E2'
                        : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    {
                      color:
                        activeTab === 'expense'
                          ? theme.colors.error || '#EF4444'
                          : theme.colors.outline,
                    },
                  ]}
                >
                  {expenseCount}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Income Tab */}
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'income' && [
                styles.tabBtnActive,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  shadowOpacity: theme.dark ? 0.3 : 0.08,
                },
              ],
            ]}
            onPress={() => handleTabChange('income')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'income' }}
            accessibilityLabel={`${t('income')}, ${incomeCount} ${t('categories')}`}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name="arrow-up-circle"
                size={18}
                color={
                  activeTab === 'income'
                    ? (theme.colors as any).income || '#16A34A'
                    : theme.colors.outline
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === 'income'
                        ? theme.colors.onSurface
                        : theme.colors.onSurfaceVariant,
                    fontFamily:
                      activeTab === 'income'
                        ? 'Inter-SemiBold'
                        : 'Inter-Medium',
                    fontWeight: activeTab === 'income' ? '600' : '500',
                  },
                ]}
              >
                {t('income')}
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  {
                    backgroundColor:
                      activeTab === 'income'
                        ? theme.dark
                          ? 'rgba(34, 197, 94, 0.16)'
                          : '#DCFCE7'
                        : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    {
                      color:
                        activeTab === 'income'
                          ? (theme.colors as any).income || '#16A34A'
                          : theme.colors.outline,
                    },
                  ]}
                >
                  {incomeCount}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {filteredCategories.length > 1 && (
          <View style={styles.metaRow}>
            <Ionicons
              name="reorder-two-outline"
              size={15}
              color={theme.colors.outline}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.metaText, { color: theme.colors.outline }]}>
              {t('holdAndDragToReorder')}
            </Text>
          </View>
        )}
      </View>

      <DraggableFlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          const otherCategories = categories.filter(
            (c) => c.type !== activeTab,
          );
          const newCategoriesList =
            activeTab === 'expense'
              ? [...data, ...otherCategories]
              : [...otherCategories, ...data];
          updateCategoriesOrder(newCategoriesList);
        }}
        containerStyle={styles.listContainer}
        style={styles.list}
        autoscrollThreshold={80}
        autoscrollSpeed={150}
        dragItemOverflow={true}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 200 },
        ]}
        ListHeaderComponent={null}
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Ionicons
                name={activeTab === 'expense' ? 'cart-outline' : 'cash-outline'}
                size={32}
                color={theme.colors.outline}
              />
            </View>
            <Text
              style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
            >
              {t('noCategoriesDefined')}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.colors.outline }]}
            >
              {t('noCategoriesSubtitleText')}
            </Text>
          </Animated.View>
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
        onPress={() => router.push('/add-category')}
      />
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerBtn: {
      padding: 8,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topControlSection: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    menuTrack: {
      flexDirection: 'row',
      borderRadius: 14,
      padding: 3,
      borderWidth: 1,
      gap: 4,
    },
    tabBtn: {
      flex: 1,
      height: 40,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    tabBtnActive: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1.5 },
      shadowOpacity: 0.08,
      shadowRadius: 2.5,
      elevation: 2,
    },
    tabContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabLabel: {
      fontSize: fontScale(13),
      letterSpacing: -0.2,
      marginRight: 8,
    },
    tabCountBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabCountText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      marginTop: 4,
    },
    metaText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
    },
    listContainer: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingTop: 8,
    },
    card: {
      marginBottom: 8,
      marginHorizontal: 16,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    dragHandle: {
      width: 36,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    metaCol: {
      flex: 1,
      justifyContent: 'center',
    },
    categoryName: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      fontSize: fontScale(14),
      letterSpacing: -0.1,
    },
    empty: {
      alignItems: 'center',
      paddingTop: 48,
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: fontScale(16),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
    },
  });
