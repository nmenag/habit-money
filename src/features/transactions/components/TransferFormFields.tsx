import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Account } from '../../../store/useStore';

interface TransferFormFieldsProps {
  theme: any;
  styles: any;
  t: (key: any) => string;
  translateName: (name: string) => string;
  formatCurrency: (value: number) => string;
  getAccountIcon: (type?: string) => string;
  selectedAccountObj?: Account;
  selectedToAccountObj?: Account;
  openAccountSheet: (type: 'from' | 'to') => void;
}

export const TransferFormFields = React.memo(
  ({
    theme,
    styles,
    t,
    translateName,
    formatCurrency,
    getAccountIcon,
    selectedAccountObj,
    selectedToAccountObj,
    openAccountSheet,
  }: TransferFormFieldsProps) => {
    return (
      <View style={styles.transferAccountsGroup}>
        <TouchableOpacity
          style={[
            styles.selectorCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
              marginBottom: 12,
            },
          ]}
          onPress={() => openAccountSheet('from')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${t('withdrawFrom') || 'From Account'}: ${selectedAccountObj ? translateName(selectedAccountObj.name) : t('selectAccount')}, ${t('balance') || 'balance'}: ${selectedAccountObj ? formatCurrency(selectedAccountObj.currentBalance) : ''}`}
          accessibilityHint={
            t('changeAccountHint') ||
            'Double tap to select a different source account'
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
                {t('withdrawFrom') || 'From Account'}
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
            },
          ]}
          onPress={() => openAccountSheet('to')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${t('depositTo') || 'To Account'}: ${selectedToAccountObj ? translateName(selectedToAccountObj.name) : t('selectAccount')}, ${t('balance') || 'balance'}: ${selectedToAccountObj ? formatCurrency(selectedToAccountObj.currentBalance) : ''}`}
          accessibilityHint={
            t('changeAccountHint') ||
            'Double tap to select a different destination account'
          }
        >
          <View style={styles.selectorCardLeft}>
            <View
              style={[
                styles.selectorIconBg,
                {
                  backgroundColor:
                    selectedToAccountObj?.color || theme.colors.primary,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getAccountIcon(selectedToAccountObj?.type) as any}
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
                {t('depositTo') || 'To Account'}
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.selectorCardValue,
                  { color: theme.colors.onSurface },
                ]}
              >
                {selectedToAccountObj
                  ? translateName(selectedToAccountObj.name)
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
              {selectedToAccountObj
                ? formatCurrency(selectedToAccountObj.currentBalance)
                : ''}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);

TransferFormFields.displayName = 'TransferFormFields';
