import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { VisitedGlobe } from '../components/VisitedGlobe';
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VisitedGlobe visitedCountries={countriesVisited} />

        <Text style={styles.mapSubText}>
          Drag to rotate. Pinch to zoom. Blue countries are visited.
        </Text>

        <Text style={styles.sectionTitle}>Visited (sample)</Text>
        <View style={styles.chipsContainer}>
          {countriesVisited.map((country) => (
            <View key={country} style={styles.chip}>
              <Text style={styles.chipText}>{country}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  mapSubText: {
    marginTop: 10,
    marginBottom: 12,
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
