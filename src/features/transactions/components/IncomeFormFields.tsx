import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Account, Category } from '../../../store/useStore';
import { getValidCategoryIcon } from '../../../constants';

interface IncomeFormFieldsProps {
  theme: any;
  styles: any;
  t: (key: any) => string;
  translateName: (name: string) => string;
  formatCurrency: (value: number) => string;
  getAccountIcon: (type?: string) => string;
  selectedAccountObj?: Account;
  openAccountSheet: (type: 'from' | 'to') => void;
  selectedCategoryObj?: Category;
  setCategorySheetOpen: (open: boolean) => void;
}

export const IncomeFormFields = React.memo(
  ({
    theme,
    styles,
    t,
    translateName,
    formatCurrency,
    getAccountIcon,
    selectedAccountObj,
    openAccountSheet,
    selectedCategoryObj,
    setCategorySheetOpen,
  }: IncomeFormFieldsProps) => {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.selectorCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
              paddingLeft: 20,
            },
          ]}
          onPress={() => openAccountSheet('from')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${t('depositTo') || 'Deposit to'}: ${selectedAccountObj ? translateName(selectedAccountObj.name) : t('selectAccount')}, ${t('balance') || 'balance'}: ${selectedAccountObj ? formatCurrency(selectedAccountObj.currentBalance) : ''}`}
          accessibilityHint={
            t('changeAccountHint') || 'Double tap to select a different account'
          }
        >
          <View
            style={[
              styles.selectorAccentBar,
              {
                backgroundColor:
                  selectedAccountObj?.color || theme.colors.primary,
              },
            ]}
          />
          <View style={styles.selectorCardLeft}>
            <View
              style={[
                styles.selectorIconBg,
                {
                  backgroundColor: `${selectedAccountObj?.color || theme.colors.primary}12`,
                  borderColor: `${selectedAccountObj?.color || theme.colors.primary}2B`,
                  borderWidth: 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getAccountIcon(selectedAccountObj?.type) as any}
                size={20}
                color={selectedAccountObj?.color || theme.colors.primary}
              />
            </View>
            <View style={styles.selectorCardTextCol}>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: theme.colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                }}
              >
                {t('depositTo')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: 15,
                  color: theme.colors.onSurface,
                  marginTop: 2,
                }}
              >
                {selectedAccountObj
                  ? translateName(selectedAccountObj.name)
                  : t('selectAccount')}
              </Text>
            </View>
          </View>
          <View style={styles.selectorCardRight}>
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
                fontSize: 14,
                color: theme.colors.onSurface,
                marginRight: 8,
              }}
            >
              {selectedAccountObj
                ? formatCurrency(selectedAccountObj.currentBalance)
                : ''}
            </Text>
            <View
              style={[
                styles.chevronCircle,
                {
                  backgroundColor: theme.dark ? '#1A2421' : '#F0F4F2',
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.selectorCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
              marginTop: 16,
              paddingLeft: 20,
            },
          ]}
          onPress={() => setCategorySheetOpen(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${t('categories') || 'Category'}: ${selectedCategoryObj ? translateName(selectedCategoryObj.name) : t('selectCategory') || 'Select Category'}`}
          accessibilityHint={
            t('changeCategoryHint') || 'Double tap to select a category'
          }
        >
          <View
            style={[
              styles.selectorAccentBar,
              {
                backgroundColor:
                  selectedCategoryObj?.color || theme.colors.primary,
              },
            ]}
          />
          <View style={styles.selectorCardLeft}>
            <View
              style={[
                styles.selectorIconBg,
                {
                  backgroundColor: `${selectedCategoryObj?.color || theme.colors.primary}12`,
                  borderColor: `${selectedCategoryObj?.color || theme.colors.primary}2B`,
                  borderWidth: 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getValidCategoryIcon(selectedCategoryObj?.icon) as any}
                size={20}
                color={selectedCategoryObj?.color || theme.colors.primary}
              />
            </View>
            <View style={styles.selectorCardTextCol}>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: theme.colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                }}
              >
                {t('categories') || 'Category'}
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontWeight: '500',
                  fontSize: 15,
                  color: theme.colors.onSurface,
                  marginTop: 2,
                }}
              >
                {selectedCategoryObj
                  ? translateName(selectedCategoryObj.name)
                  : t('selectCategory') || 'Select Category'}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.chevronCircle,
              {
                backgroundColor: theme.dark ? '#1A2421' : '#F0F4F2',
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={14}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        </TouchableOpacity>
      </>
    );
  },
);

IncomeFormFields.displayName = 'IncomeFormFields';
