import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Account, Category, Budget } from '../../../store/useStore';
import { getValidCategoryIcon } from '../../../constants';

interface ExpenseFormFieldsProps {
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
  selectedBudgetObj?: Budget;
  setBudgetSheetOpen: (open: boolean) => void;
  budgets: Budget[];
  categories: Category[];
  currentBudgetUsage: { spent: number; progress: number; remaining: number };
}

export const ExpenseFormFields = React.memo(
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
    selectedBudgetObj,
    setBudgetSheetOpen,
    budgets,
    categories,
    currentBudgetUsage,
  }: ExpenseFormFieldsProps) => {
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
          accessibilityLabel={`${t('withdrawFrom') || 'Withdraw from'}: ${selectedAccountObj ? translateName(selectedAccountObj.name) : t('selectAccount')}, ${t('balance') || 'balance'}: ${selectedAccountObj ? formatCurrency(selectedAccountObj.currentBalance) : ''}`}
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
                {t('withdrawFrom')}
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

        {budgets.length > 0 && (
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
            onPress={() => setBudgetSheetOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${t('budgets') || 'Budget'}: ${selectedBudgetObj ? translateName(selectedBudgetObj.name || categories.find((c) => c.id === selectedBudgetObj.categoryId)?.name || t('budgets')) : t('noBudget')}${selectedBudgetObj ? ', ' + formatCurrency(currentBudgetUsage.spent) + ' of ' + formatCurrency(selectedBudgetObj.amount) + ' spent' : ''}`}
            accessibilityHint={
              t('changeBudgetHint') || 'Double tap to select a budget'
            }
          >
            <View
              style={[
                styles.selectorAccentBar,
                {
                  backgroundColor:
                    selectedBudgetObj?.color || theme.colors.outline,
                },
              ]}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.budgetCardTop}>
                <View style={styles.selectorCardLeft}>
                  <View
                    style={[
                      styles.selectorIconBg,
                      {
                        backgroundColor: `${selectedBudgetObj?.color || theme.colors.outline}12`,
                        borderColor: `${selectedBudgetObj?.color || theme.colors.outline}2B`,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        selectedBudgetObj ? 'wallet-outline' : 'slash-forward'
                      }
                      size={20}
                      color={selectedBudgetObj?.color || theme.colors.outline}
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
                      {t('budgets') || 'Budget'}
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
                      {selectedBudgetObj
                        ? translateName(
                            selectedBudgetObj.name ||
                              categories.find(
                                (c) => c.id === selectedBudgetObj.categoryId,
                              )?.name ||
                              t('budgets'),
                          )
                        : t('noBudget')}
                    </Text>
                  </View>
                </View>
                <View style={styles.selectorCardRight}>
                  {selectedBudgetObj && (
                    <Text
                      style={{
                        fontFamily: 'Inter-Regular',
                        fontWeight: '400',
                        fontSize: 12,
                        color: theme.colors.onSurfaceVariant,
                        marginRight: 8,
                      }}
                    >
                      {formatCurrency(currentBudgetUsage.spent)} of{' '}
                      {formatCurrency(selectedBudgetObj.amount)}
                    </Text>
                  )}
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
              </View>

              {selectedBudgetObj && (
                <View style={styles.budgetProgressContainer}>
                  <View
                    style={[
                      styles.budgetProgressBar,
                      {
                        backgroundColor: theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.budgetProgressFill,
                        {
                          width: `${Math.min(currentBudgetUsage.progress * 100, 100)}%`,
                          backgroundColor:
                            selectedBudgetObj.color || theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </>
    );
  },
);

ExpenseFormFields.displayName = 'ExpenseFormFields';
