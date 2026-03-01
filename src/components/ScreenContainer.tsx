import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

type ScreenContainerProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  contentVariant?: 'card' | 'plain';
  hideHeader?: boolean;
  flushBottom?: boolean;
}>;

export function ScreenContainer({
  title,
  subtitle,
  contentVariant = 'card',
  hideHeader = false,
  flushBottom = false,
  children,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + 12,
          paddingBottom: flushBottom ? 0 : Math.max(insets.bottom, 12),
        },
      ]}
    >
      {!hideHeader ? <Text style={styles.title}>{title}</Text> : null}
      {!hideHeader && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View
        style={[
          styles.contentBase,
          hideHeader && styles.contentNoHeader,
          contentVariant === 'card' ? styles.contentCard : styles.contentPlain,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.mutedText,
  },
  contentBase: {
    marginTop: 12,
    flex: 1,
  },
  contentNoHeader: {
    marginTop: 0,
  },
  contentCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 16,
  },
  contentPlain: {
    padding: 0,
  },
});
