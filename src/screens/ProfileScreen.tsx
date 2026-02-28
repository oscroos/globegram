import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  return (
    <ScreenContainer title="My Profile" subtitle="Your stats, preferences, and account settings.">
      <View style={styles.card}>
        <Text style={styles.name}>Enin Traveler</Text>
        <Text style={styles.stat}>Countries visited: 24</Text>
        <Text style={styles.stat}>Regions pinned: 47</Text>
      </View>

      <View style={styles.settingList}>
        <Text style={styles.setting}>Profile details</Text>
        <Text style={styles.setting}>Notifications</Text>
        <Text style={styles.setting}>Privacy</Text>
        <Text style={styles.setting}>Sign out</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ecfeff',
    padding: 14,
    marginBottom: 14,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  stat: {
    marginTop: 4,
    color: colors.mutedText,
  },
  settingList: {
    gap: 10,
  },
  setting: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontWeight: '500',
    backgroundColor: '#fcfcfd',
  },
});
