import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

import { useTranslation } from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';
import { Insight, InsightLevel } from '../services/types';

interface TipsCarouselProps {
  insights: Insight[];
}

interface ProcessedTipItem {
  id: string;
  title: string;
  message: string;
  recommendation?: string;
  level: InsightLevel;
  badgeLabel: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const addAlpha = (
  color: string | undefined,
  opacity: number,
  fallbackHex: string,
): string => {
  let resolvedColor = color || fallbackHex;
  if (typeof resolvedColor !== 'string') {
    resolvedColor = fallbackHex;
  }
  if (resolvedColor.startsWith('rgb')) {
    const match = resolvedColor.match(/\d+/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${opacity})`;
    }
  }
  if (!resolvedColor.startsWith('#')) {
    resolvedColor = fallbackHex;
  }
  const hex = resolvedColor.replace('#', '');
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${hex}${alpha}`;
};

export const TipsCarousel: React.FC<TipsCarouselProps> = ({ insights }) => {
  const { t, language } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const { width: windowWidth } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const cardWidth = useMemo(() => {
    return Math.min(windowWidth - 48, 500);
  }, [windowWidth]);

  const cardGap = 12;

  const defaultTips: ProcessedTipItem[] = useMemo(() => {
    const isEs = language === 'es';
    return [
      {
        id: 'rule-50-30-20',
        title: isEs
          ? 'Regla de Presupuesto 50/30/20'
          : '50/30/20 Budgeting Rule',
        message: isEs
          ? 'Destina un 50% a necesidades, 30% a gustos personales y 20% a ahorros o pago de deudas.'
          : 'Allocate 50% to needs, 30% to wants, and 20% to savings or debt payoff.',
        recommendation: isEs
          ? '💡 Ajusta tus categorías para balancear tu regla mensual.'
          : '💡 Categorize expenses to keep monthly balance in check.',
        level: 'info',
        badgeLabel: isEs ? 'HÁBITOS' : 'HABITS',
        iconName: 'pie-chart-outline',
      },
      {
        id: 'emergency-cushion',
        title: isEs ? 'Fondo de Emergencia' : 'Emergency Reserve',
        message: isEs
          ? 'Mantener guardados entre 3 y 6 meses de tus gastos fijos brinda tranquilidad ante imprevistos.'
          : 'Keeping 3 to 6 months of fixed expenses in reserve ensures financial stability.',
        recommendation: isEs
          ? '🛡️ Revisa la calculadora de Fondo de Emergencia en Metas.'
          : '🛡️ Check out Emergency Reserve setup under Goals.',
        level: 'positive',
        badgeLabel: isEs ? 'AHORRO' : 'SAVINGS',
        iconName: 'shield-checkmark-outline',
      },
      {
        id: 'no-spend-days',
        title: isEs ? 'Días Sin Gasto' : 'No-Spend Challenge',
        message: isEs
          ? 'Intenta pausar compras secundarias durante 2 días a la semana para frenar impulsos.'
          : 'Pause non-essential buying 2 days a week to build mindful spending habits.',
        recommendation: isEs
          ? '🎯 Planifica tus compras con anticipación.'
          : '🎯 Plan purchases ahead to prevent impulse buys.',
        level: 'info',
        badgeLabel: isEs ? 'RETO' : 'CHALLENGE',
        iconName: 'flame-outline',
      },
    ];
  }, [language]);

  const tipItems: ProcessedTipItem[] = useMemo(() => {
    const converted: ProcessedTipItem[] = insights.map((item) => {
      let iconName: keyof typeof Ionicons.glyphMap =
        'information-circle-outline';
      let badgeLabel = t('insights' as any) || 'INSIGHT';

      if (item.level === 'critical' || item.level === 'warning') {
        iconName = 'alert-circle-outline';
        badgeLabel = language === 'es' ? 'ALERTA' : 'ALERT';
      } else if (item.level === 'positive') {
        iconName = 'checkmark-circle-outline';
        badgeLabel = language === 'es' ? 'LOGRO' : 'PROGRESS';
      }

      return {
        id: item.id,
        title: item.title,
        message: item.message,
        recommendation: item.recommendation,
        level: item.level,
        badgeLabel,
        iconName,
      };
    });

    if (converted.length === 0) {
      return defaultTips;
    }

    if (converted.length < 3) {
      return [...converted, ...defaultTips.slice(0, 3 - converted.length)];
    }

    return converted;
  }, [insights, defaultTips, t, language]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / (cardWidth + cardGap));
      if (index >= 0 && index < tipItems.length) {
        setActiveIndex(index);
      }
    },
    [cardWidth, cardGap, tipItems.length],
  );

  const scrollToCard = useCallback(
    (index: number) => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: index * (cardWidth + cardGap),
          animated: true,
        });
        setActiveIndex(index);
      }
    },
    [cardWidth, cardGap],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons
            name="sparkles-outline"
            size={18}
            color={theme.colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            {t('insights')}
          </Text>
        </View>
        <Text style={[styles.counterText, { color: theme.colors.outline }]}>
          {activeIndex + 1} / {tipItems.length}
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={cardWidth + cardGap}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: 4,
        }}
      >
        {tipItems.map((item, index) => {
          let iconColor = theme.colors.primary;
          let iconBg = addAlpha(theme.colors.primary, 0.1, '#22C55E');
          let iconBorder = addAlpha(theme.colors.primary, 0.2, '#22C55E');
          let badgeBg = addAlpha(theme.colors.primary, 0.1, '#22C55E');
          let badgeColor = theme.colors.primary;

          if (item.level === 'critical' || item.level === 'warning') {
            iconColor =
              item.level === 'critical'
                ? theme.colors.error
                : (theme.colors as any).warning || '#F59E0B';
            iconBg = addAlpha(iconColor, 0.1, '#EF4444');
            iconBorder = addAlpha(iconColor, 0.2, '#EF4444');
            badgeBg = addAlpha(iconColor, 0.1, '#EF4444');
            badgeColor = iconColor;
          } else if (item.level === 'positive') {
            iconColor = (theme.colors as any).income || '#16A34A';
            iconBg = addAlpha(iconColor, 0.1, '#16A34A');
            iconBorder = addAlpha(iconColor, 0.2, '#16A34A');
            badgeBg = addAlpha(iconColor, 0.1, '#16A34A');
            badgeColor = iconColor;
          }

          return (
            <Card
              key={item.id}
              style={[
                styles.tipCard,
                {
                  width: cardWidth,
                  marginRight: index === tipItems.length - 1 ? 0 : cardGap,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              mode="contained"
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.topRow}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: iconBg,
                        borderColor: iconBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.iconName}
                      size={20}
                      color={iconColor}
                    />
                  </View>
                  <View
                    style={[styles.badgeChip, { backgroundColor: badgeBg }]}
                  >
                    <Text style={[styles.badgeText, { color: badgeColor }]}>
                      {item.badgeLabel}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.tipTitle, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.tipMessage,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={3}
                >
                  {item.message}
                </Text>

                {item.recommendation && (
                  <View
                    style={[
                      styles.recommendationPill,
                      {
                        backgroundColor: addAlpha(
                          theme.colors.primary,
                          0.06,
                          '#22C55E',
                        ),
                        borderColor: addAlpha(
                          theme.colors.primary,
                          0.14,
                          '#22C55E',
                        ),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recommendationText,
                        { color: theme.colors.primary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.recommendation}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>

      {tipItems.length > 1 && (
        <View style={styles.paginationRow}>
          {tipItems.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => scrollToCard(i)}
                activeOpacity={0.7}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                    width: isActive ? 20 : 6,
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginTop: 16,
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    titleWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: fontScale(15),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    counterText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    tipCard: {
      borderRadius: theme.roundness || 16,
      borderWidth: 1,
      elevation: 0,
    },
    cardContent: {
      padding: 16,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: fontScale(10),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    tipTitle: {
      fontSize: fontScale(15),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      marginBottom: 6,
    },
    tipMessage: {
      fontSize: fontScale(13),
      fontFamily: 'Inter-Regular',
      fontWeight: '400',
      lineHeight: 19,
    },
    recommendationPill: {
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
    },
    recommendationText: {
      fontSize: fontScale(12),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      lineHeight: 16,
    },
    paginationRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
      gap: 6,
    },
    dot: {
      height: 6,
      borderRadius: 3,
    },
  });
