import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {
  Card,
  FAB,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
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

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => c.type === activeTab)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [categories, activeTab]);

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
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/add-category')}
              style={styles.headerBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('addCategory')}
            >
              <Ionicons name="add" size={26} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.topControlSection}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TransactionType)}
          buttons={[
            {
              value: 'expense',
              label: t('expenses'),
              showSelectedCheck: true,
              style: styles.segmentedBtn,
            },
            {
              value: 'income',
              label: t('income'),
              showSelectedCheck: true,
              style: styles.segmentedBtn,
            },
          ]}
          style={styles.segmentedButtons}
        />

        <View style={styles.categoryCountRow}>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Ionicons
              name="shapes-outline"
              size={12}
              color={theme.colors.onSurfaceVariant}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.countBadgeText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {filteredCategories.length}{' '}
              {activeTab === 'expense' ? t('expenses') : t('income')}
            </Text>
          </View>
        </View>
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
        ListHeaderComponent={
          filteredCategories.length > 1 ? (
            <View style={styles.dragHelpRow}>
              <Ionicons
                name="reorder-two-outline"
                size={15}
                color={theme.colors.outline}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[styles.dragHelpText, { color: theme.colors.outline }]}
              >
                {t('holdAndDragToReorder')}
              </Text>
            </View>
          ) : null
        }
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
    segmentedBtn: {
      flex: 1,
    },
    categoryCountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 4,
    },
    countBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    countBadgeText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    segmentedButtons: {
      borderRadius: 14,
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
    dragHelpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      marginBottom: 4,
    },
    dragHelpText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Regular',
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
