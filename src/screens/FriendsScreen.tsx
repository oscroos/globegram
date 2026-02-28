import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';

const friends = ['Maya', 'Oskar', 'Leila', 'Chen', 'Sofia', 'Jonas'];

export function FriendsScreen() {
  return (
    <ScreenContainer title="Friends" subtitle="People you follow and travel with.">
      <View style={styles.list}>
        {friends.map((friend) => (
          <View key={friend} style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{friend[0]}</Text>
            </View>
            <Text style={styles.name}>{friend}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fcfcfd',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '700',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
