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
const MAP_HEIGHT = 390;

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
          <View style={styles.mapOverlaySwitch}>
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
                  Map
                </Text>
              </Pressable>
            </View>
          </View>

          {mapMode === 'globe' ? (
            <View style={styles.globeOffset}>
              <VisitedGlobe visitedCountries={countriesVisited} height={MAP_HEIGHT} />
            </View>
          ) : (
            <VisitedFlatMap visitedCountries={countriesVisited} height={MAP_HEIGHT} />
          )}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendLeft}>
            <View style={styles.legendSwatch} />
            <Text style={styles.legendText}>Visited</Text>
            <Pressable style={({ pressed }) => [styles.friendButton, pressed && styles.friendButtonPressed]}>
              <Text style={styles.friendButtonText}>+ compare</Text>
            </Pressable>
          </View>
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
    marginTop: -24,
    marginHorizontal: -20,
  },
  mapOverlaySwitch: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: 'center',
  },
  globeOffset: {
    marginTop: 0,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(229, 231, 235, 0.8)',
    borderRadius: 999,
    padding: 3,
    gap: 4,
  },
  modeButton: {
    borderRadius: 999,
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  legendRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  legendText: {
    fontSize: 13,
    color: colors.mutedText,
    fontWeight: '600',
  },
  friendButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  friendButtonPressed: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  friendButtonText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
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
