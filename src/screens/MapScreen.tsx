import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VisitedFlatMap } from '../components/VisitedFlatMap';
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
  'Cape Verde',
];

export function MapScreen() {
  const [mapMode, setMapMode] = useState<'globe' | 'flat'>('globe');

  return (
    <ScreenContainer
      title="Map"
      contentVariant="plain"
      hideHeader
    >
      <View style={styles.content}>
        <View style={styles.mapFullBleed}>
          {mapMode === 'globe' ? (
            <VisitedGlobe visitedCountries={countriesVisited} />
          ) : (
            <VisitedFlatMap visitedCountries={countriesVisited} />
          )}
        </View>

        <View style={styles.modeSwitch}>
          <Pressable
            style={[styles.modeButton, mapMode === 'globe' && styles.modeButtonActive]}
            onPress={() => setMapMode('globe')}
          >
            <Text style={[styles.modeButtonText, mapMode === 'globe' && styles.modeButtonTextActive]}>
              Globe
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, mapMode === 'flat' && styles.modeButtonActive]}
            onPress={() => setMapMode('flat')}
          >
            <Text style={[styles.modeButtonText, mapMode === 'flat' && styles.modeButtonTextActive]}>
              Flat
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Visited (sample)</Text>
        <View style={styles.chipsContainer}>
          {countriesVisited.map((country) => (
            <View key={country} style={styles.chip}>
              <Text style={styles.chipText}>{country}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  mapFullBleed: {
    marginTop: -12,
    marginHorizontal: -20,
  },
  modeSwitch: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  modeButtonActive: {
    backgroundColor: colors.surface,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mutedText,
  },
  modeButtonTextActive: {
    color: colors.text,
  },
  sectionTitle: {
    marginTop: 12,
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
