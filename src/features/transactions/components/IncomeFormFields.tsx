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
          <View style={styles.selectorCardLeft}>
            <View
              style={[
                styles.selectorIconBg,
                {
                  backgroundColor:
                    selectedAccountObj?.color || theme.colors.primary,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getAccountIcon(selectedAccountObj?.type) as any}
                size={20}
                color="#fff"
              />
            </View>
            <View style={styles.selectorCardTextCol}>
              <Text
                variant="labelSmall"
                style={[
                  styles.selectorCardLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('depositTo')}
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.selectorCardValue,
                  { color: theme.colors.onSurface },
                ]}
              >
                {selectedAccountObj
                  ? translateName(selectedAccountObj.name)
                  : t('selectAccount')}
              </Text>
            </View>
          </View>
          <View style={styles.selectorCardRight}>
            <Text
              variant="titleSmall"
              style={[
                styles.selectorCardBalance,
                { color: theme.colors.onSurface },
              ]}
            >
              {selectedAccountObj
                ? formatCurrency(selectedAccountObj.currentBalance)
                : ''}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
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
          <View style={styles.selectorCardLeft}>
            <View
              style={[
                styles.selectorIconBg,
                {
                  backgroundColor:
                    selectedCategoryObj?.color || theme.colors.primary,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getValidCategoryIcon(selectedCategoryObj?.icon) as any}
                size={20}
                color="#fff"
              />
            </View>
            <View style={styles.selectorCardTextCol}>
              <Text
                variant="labelSmall"
                style={[
                  styles.selectorCardLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {t('categories') || 'Category'}
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.selectorCardValue,
                  { color: theme.colors.onSurface },
                ]}
              >
                {selectedCategoryObj
                  ? translateName(selectedCategoryObj.name)
                  : t('selectCategory') || 'Select Category'}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </>
    );
  },
);

IncomeFormFields.displayName = 'IncomeFormFields';
