import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';

const countriesVisited = [
  'Norway',
  'Sweden',
  'Denmark',
  'Germany',
  'Spain',
  'Japan',
];

export function MapScreen() {
  return (
    <ScreenContainer
      title="Map"
      subtitle="Countries you have visited will be highlighted here."
    >
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Interactive world map placeholder</Text>
        <Text style={styles.mapSubText}>Next step: integrate react-native-maps or SVG map data.</Text>
      </View>

      <Text style={styles.sectionTitle}>Visited (sample)</Text>
      <View style={styles.chipsContainer}>
        {countriesVisited.map((country) => (
          <View key={country} style={styles.chip}>
            <Text style={styles.chipText}>{country}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ecfeff',
    padding: 18,
    marginBottom: 18,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  mapSubText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.mutedText,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: colors.text,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
