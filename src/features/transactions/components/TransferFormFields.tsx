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
              paddingLeft: 20,
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
                {t('withdrawFrom') || 'From Account'}
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
              paddingLeft: 20,
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
          <View
            style={[
              styles.selectorAccentBar,
              {
                backgroundColor:
                  selectedToAccountObj?.color || theme.colors.primary,
              },
            ]}
          />
          <View style={styles.selectorCardLeft}>
            <View
              style={[
                styles.selectorIconBg,
                {
                  backgroundColor: `${selectedToAccountObj?.color || theme.colors.primary}12`,
                  borderColor: `${selectedToAccountObj?.color || theme.colors.primary}2B`,
                  borderWidth: 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getAccountIcon(selectedToAccountObj?.type) as any}
                size={20}
                color={selectedToAccountObj?.color || theme.colors.primary}
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
                {t('depositTo') || 'To Account'}
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
                {selectedToAccountObj
                  ? translateName(selectedToAccountObj.name)
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
              {selectedToAccountObj
                ? formatCurrency(selectedToAccountObj.currentBalance)
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
      </View>
    );
  },
);

TransferFormFields.displayName = 'TransferFormFields';
