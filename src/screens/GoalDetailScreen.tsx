import { Ionicons } from '@expo/vector-icons';
import { differenceInMonths, parseISO } from 'date-fns';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import {
  Button,
  Card,
  ProgressBar,
  Text,
  Title,
  useTheme,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Goal, useStore, useTranslation } from '../store/useStore';

export const GoalDetailScreen = ({ route, navigation }: any) => {
  const { goalId } = route.params;
  const { goals, formatCurrency, deleteGoal, contributeToGoal } = useStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = defaultStyles(theme);

  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState('');

  const goal = goals.find((g) => g.id === goalId);

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text>Goal not found</Text>
      </View>
    );
  }

  const progress = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100,
  );
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  let monthlyEstimate = 0;
  if (goal.deadline && remaining > 0) {
    const deadlineDate = parseISO(goal.deadline);
    const months = differenceInMonths(deadlineDate, new Date());
    if (months > 0) {
      monthlyEstimate = remaining / months;
    } else {
      monthlyEstimate = remaining;
    }
  }

  const handleDelete = () => {
    Alert.alert(
      t('confirmDelete') || 'Confirm Delete',
      t('confirmDeleteGoal') || 'Are you sure you want to delete this goal?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteGoal(goal.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleAddFunds = () => {
    const val = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(val) || val <= 0) return;

    contributeToGoal(goal.id, val);
    setAmount('');
    setVisible(false);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: goal.color || theme.colors.primary },
              ]}
            >
              <Ionicons
                name={(goal.icon as any) || 'trophy'}
                size={48}
                color="#fff"
              />
            </View>
            <Title style={styles.goalTitle}>{goal.name}</Title>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    goal.status === 'completed'
                      ? '#4caf50'
                      : theme.colors.secondaryContainer,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      goal.status === 'completed'
                        ? '#fff'
                        : theme.colors.onSecondaryContainer,
                  },
                ]}
              >
                {goal.status === 'completed'
                  ? t('goalReached')
                  : t('activeGoal')}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.progressRow}>
              <Text variant="titleMedium" style={styles.progressLabel}>
                {t('progress')}
              </Text>
              <Text
                variant="headlineSmall"
                style={[
                  styles.progressValue,
                  { color: goal.color || theme.colors.primary },
                ]}
              >
                {Math.round(progress)}%
              </Text>
            </View>
            <ProgressBar
              progress={progress / 100}
              color={goal.color || theme.colors.primary}
              style={styles.progressBar}
            />

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text variant="labelMedium" style={styles.detailLabel}>
                  {t('currentAmount')}
                </Text>
                <Text variant="titleLarge" style={styles.detailValue}>
                  {formatCurrency(goal.currentAmount)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text variant="labelMedium" style={styles.detailLabel}>
                  {t('targetAmount')}
                </Text>
                <Text variant="titleLarge" style={styles.detailValue}>
                  {formatCurrency(goal.targetAmount)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.formulaSection}>
              <View style={styles.formulaRow}>
                <View style={styles.formulaInfo}>
                  <Text variant="bodyMedium" style={styles.formulaLabel}>
                    {t('remainingAmount')}
                  </Text>
                  <Text variant="labelSmall" style={styles.formulaDescription}>
                    {t('targetAmount')} - {t('currentAmount')}
                  </Text>
                </View>
                <Text variant="titleMedium" style={styles.formulaValue}>
                  {formatCurrency(remaining)}
                </Text>
              </View>

              {goal.deadline ? (
                <View style={[styles.formulaRow, styles.monthlyRow]}>
                  <View style={styles.formulaInfo}>
                    <Text variant="bodyMedium" style={styles.formulaLabel}>
                      {t('monthlySavingNeeded')}
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={styles.formulaDescription}
                    >
                      {t('remainingAmount')} /{' '}
                      {t('monthsRemaining') || 'months left'}
                    </Text>
                  </View>
                  <Text
                    variant="titleLarge"
                    style={[
                      styles.formulaValue,
                      { color: theme.colors.primary, fontWeight: 'bold' },
                    ]}
                  >
                    {formatCurrency(monthlyEstimate)}
                  </Text>
                </View>
              ) : (
                <View style={styles.hintContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={theme.colors.outline}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.hintText, { color: theme.colors.outline }]}
                  >
                    {t('noDeadlineHint')}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => setVisible(true)}
            style={[
              styles.actionButton,
              { backgroundColor: goal.color || theme.colors.primary },
            ]}
            icon="plus-circle"
            contentStyle={styles.mainActionBtn}
          >
            {t('addFunds') || 'Add Funds'}
          </Button>

          <View style={styles.secondaryActions}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('AddGoal', { goal })}
              style={styles.secondaryButton}
              icon="pencil"
            >
              {t('edit')}
            </Button>
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.secondaryButton}
              textColor={theme.colors.error}
              icon="trash-can"
            >
              {t('delete')}
            </Button>
          </View>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={visible}
          onDismiss={() => setVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{t('addFunds') || 'Add Funds'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('amount')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              mode="outlined"
              autoFocus
              left={
                <TextInput.Affix
                  text={formatCurrency(0).replace(/[0.,]/g, '')}
                />
              }
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>{t('cancel')}</Button>
            <Button
              onPress={handleAddFunds}
              mode="contained"
              style={{ borderRadius: 8 }}
            >
              {t('add')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerCard: {
      margin: 16,
      paddingVertical: 32,
      borderRadius: 24,
      elevation: 4,
    },
    headerContent: {
      alignItems: 'center',
    },
    iconWrapper: {
      width: 96,
      height: 96,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      elevation: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    goalTitle: {
      fontSize: 28,
      fontWeight: '800',
      textAlign: 'center',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    statsCard: {
      margin: 16,
      borderRadius: 24,
      elevation: 2,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 12,
    },
    progressLabel: {
      fontWeight: '700',
    },
    progressValue: {
      fontWeight: '900',
    },
    progressBar: {
      height: 12,
      borderRadius: 6,
      marginBottom: 24,
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
      fontWeight: '600',
    },
    detailValue: {
      fontWeight: '800',
    },
    divider: {
      height: 1,
      backgroundColor: 'rgba(0,0,0,0.05)',
      marginVertical: 16,
    },
    formulaSection: {
      marginTop: 8,
    },
    formulaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    monthlyRow: {
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.03)',
    },
    formulaInfo: {
      flex: 1,
    },
    formulaLabel: {
      fontWeight: '600',
    },
    formulaDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    formulaValue: {
      fontWeight: '700',
    },
    hintContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      padding: 12,
      backgroundColor: 'rgba(0,0,0,0.02)',
      borderRadius: 12,
    },
    hintText: {
      marginLeft: 8,
      fontStyle: 'italic',
    },
    actions: {
      padding: 16,
    },
    actionButton: {
      marginBottom: 16,
      borderRadius: 16,
      elevation: 4,
    },
    mainActionBtn: {
      height: 56,
    },
    secondaryActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    secondaryButton: {
      flex: 0.48,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      elevation: 1,
    },
    dialog: {
      borderRadius: 24,
    },
  });
