import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';

const sampleUpdates = [
  { id: '1', name: 'Maya', message: 'Visited Lisbon, Portugal', ago: '2h ago' },
  { id: '2', name: 'Oskar', message: 'Added Iceland to his map', ago: '5h ago' },
  { id: '3', name: 'Leila', message: 'Checked in from Marrakech, Morocco', ago: '1d ago' },
];

export function FeedScreen() {
  return (
    <ScreenContainer title="Feed" subtitle="Latest travel updates from friends.">
      <View style={styles.list}>
        {sampleUpdates.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.ago}>{item.ago}</Text>
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
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fcfcfd',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  message: {
    marginTop: 4,
    color: colors.text,
    fontSize: 14,
  },
  ago: {
    marginTop: 6,
    color: colors.mutedText,
    fontSize: 12,
  },
});
