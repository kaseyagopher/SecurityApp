import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING } from '../../constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  headerRight?: ReactNode;
  darkHeader?: boolean;
  contentStyle?: ViewStyle;
  onRefresh?: () => Promise<void> | void;
};

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  headerRight,
  darkHeader,
  contentStyle,
  onRefresh,
}: Props) {
  const gradient = darkHeader ? COLORS.darkHeaderGradient : COLORS.headerGradient;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  const body = (
    <View style={[styles.content, contentStyle]}>
      {children}
      <View style={styles.tabSpacer} />
    </View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradient]} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
      </LinearGradient>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            ) : undefined
          }
        >
          {body}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 56,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerText: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.white },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.88)', marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingTop: SPACING.md, gap: SPACING.md },
  tabSpacer: { height: SPACING.tabBar },
});
