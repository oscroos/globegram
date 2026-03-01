import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { VisitedFlatMap } from '../components/VisitedFlatMap';
import { ScreenContainer } from '../components/ScreenContainer';
import { VisitedGlobe } from '../components/VisitedGlobe';
import worldGeoJsonData from '../data/world.json';
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
const REGION_OPTIONS = ['World', 'Europe', 'N. America', 'S. America', 'Asia', 'Africa', 'Oceania'];
const FRIENDS = [
  {
    id: 'friend-1',
    name: 'Lina',
    visitedCountries: ['Norway', 'France', 'Italy', 'Japan', 'Canada', 'Brazil'],
  },
  {
    id: 'friend-2',
    name: 'Marcus',
    visitedCountries: ['Germany', 'Spain', 'Portugal', 'Mexico', 'United States of America', 'Argentina', 'Sweden'],
  },
  {
    id: 'friend-3',
    name: 'Aisha',
    visitedCountries: ['Sweden', 'Denmark', 'United Kingdom', 'India', 'South Africa', 'Australia'],
  },
];

type WorldFeature = {
  properties?: {
    NAME?: string;
    ADMIN?: string;
    name?: string;
    NAME_LONG?: string;
  };
};

function normalizeCountryName(name: string) {
  const normalized = (name || '').trim().toLowerCase();
  if (normalized === 'cape verde' || normalized === 'cabo verde') return 'cape verde';
  return normalized;
}

function getCountryName(feature: WorldFeature) {
  const properties = feature?.properties;
  return (properties?.NAME || properties?.ADMIN || properties?.name || properties?.NAME_LONG || '').trim();
}

function buildVisitedSet(countries: string[]) {
  return new Set(countries.map((country) => normalizeCountryName(country)));
}

export function MapScreen() {
  const [mapMode, setMapMode] = useState<'globe' | 'flat'>('globe');
  const [countryGroup, setCountryGroup] = useState('World');
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const selectedFriends = useMemo(
    () =>
      selectedFriendIds
        .map((id) => FRIENDS.find((friend) => friend.id === id))
        .filter((friend): friend is (typeof FRIENDS)[number] => Boolean(friend)),
    [selectedFriendIds]
  );

  const firstFriend = selectedFriends[0] || null;
  const secondFriend = selectedFriends[1] || null;

  const visitedSet = useMemo(() => buildVisitedSet(countriesVisited), []);
  const firstFriendSet = useMemo(
    () => buildVisitedSet(firstFriend?.visitedCountries || []),
    [firstFriend]
  );
  const secondFriendSet = useMemo(
    () => buildVisitedSet(secondFriend?.visitedCountries || []),
    [secondFriend]
  );

  const allCountries = useMemo(() => {
    const byNormalizedName = new Map<string, string>();
    const features = (worldGeoJsonData?.features || []) as WorldFeature[];

    for (const feature of features) {
      const rawName = getCountryName(feature);
      if (!rawName) continue;
      const normalizedName = normalizeCountryName(rawName);
      if (!normalizedName) continue;
      if (!byNormalizedName.has(normalizedName)) {
        byNormalizedName.set(normalizedName, rawName);
      }
    }

    return [...byNormalizedName.entries()]
      .map(([key, displayName]) => ({ key, displayName }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, []);

  const totalCountriesInView = allCountries.length;
  const userVisitedCountInView = useMemo(
    () => allCountries.reduce((count, country) => count + (visitedSet.has(country.key) ? 1 : 0), 0),
    [allCountries, visitedSet]
  );
  const firstFriendCountInView = useMemo(
    () => allCountries.reduce((count, country) => count + (firstFriendSet.has(country.key) ? 1 : 0), 0),
    [allCountries, firstFriendSet]
  );
  const secondFriendCountInView = useMemo(
    () => allCountries.reduce((count, country) => count + (secondFriendSet.has(country.key) ? 1 : 0), 0),
    [allCountries, secondFriendSet]
  );

  const userProgressPct = totalCountriesInView > 0 ? (userVisitedCountInView / totalCountriesInView) * 100 : 0;
  const firstFriendProgressPct = totalCountriesInView > 0 ? (firstFriendCountInView / totalCountriesInView) * 100 : 0;
  const secondFriendProgressPct = totalCountriesInView > 0
    ? (secondFriendCountInView / totalCountriesInView) * 100
    : 0;

  const hasComparison = selectedFriends.length > 0;
  const compareButtonLabel = hasComparison ? 'Change' : '+ compare';

  return (
    <ScreenContainer title="Map" contentVariant="plain" hideHeader flushBottom>
      <View style={styles.content}>
        <View style={styles.mapFullBleed}>
          <View style={styles.mapOverlaySwitch}>
            <View style={styles.modeSwitch}>
              <Pressable
                style={[styles.modeButton, mapMode === 'globe' && styles.modeButtonActive]}
                onPress={() => setMapMode('globe')}
              >
                <View style={styles.modeButtonContent}>
                  <Ionicons
                    name="globe-outline"
                    size={12}
                    color={mapMode === 'globe' ? colors.text : colors.mutedText}
                  />
                  <Text style={[styles.modeButtonText, mapMode === 'globe' && styles.modeButtonTextActive]}>
                    Globe
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={[styles.modeButton, mapMode === 'flat' && styles.modeButtonActive]}
                onPress={() => setMapMode('flat')}
              >
                <View style={styles.modeButtonContent}>
                  <Ionicons
                    name="map-outline"
                    size={12}
                    color={mapMode === 'flat' ? colors.text : colors.mutedText}
                  />
                  <Text style={[styles.modeButtonText, mapMode === 'flat' && styles.modeButtonTextActive]}>
                    Map
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {mapMode === 'globe' ? (
            <View style={styles.globeOffset}>
              <VisitedGlobe
                visitedCountries={countriesVisited}
                friendVisitedCountries={firstFriend?.visitedCountries || []}
                secondFriendVisitedCountries={secondFriend?.visitedCountries || []}
                height={MAP_HEIGHT}
              />
            </View>
          ) : (
            <VisitedFlatMap
              visitedCountries={countriesVisited}
              friendVisitedCountries={firstFriend?.visitedCountries || []}
              secondFriendVisitedCountries={secondFriend?.visitedCountries || []}
              height={MAP_HEIGHT}
            />
          )}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendLeft}>
            <View style={styles.legendSwatch} />
            <Text style={styles.legendText}>{hasComparison ? 'You' : 'Visited'}</Text>
            {firstFriend ? (
              <>
                <View style={styles.legendSwatchFriend} />
                <Text style={styles.legendText}>{firstFriend.name}</Text>
              </>
            ) : null}
            {secondFriend ? (
              <>
                <View style={styles.legendSwatchFriendTwo} />
                <Text style={styles.legendText}>{secondFriend.name}</Text>
                <View style={styles.legendSwatchAllThree} />
                <Text style={styles.legendText}>All</Text>
              </>
            ) : firstFriend ? (
              <>
                <View style={styles.legendSwatchBoth}>
                  <View style={[styles.legendStripe, styles.legendStripeOne]} />
                  <View style={[styles.legendStripe, styles.legendStripeTwo]} />
                  <View style={[styles.legendStripe, styles.legendStripeThree]} />
                </View>
                <Text style={styles.legendText}>Both</Text>
              </>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.friendButton, pressed && styles.friendButtonPressed]}
              onPress={() => setIsCompareModalOpen(true)}
            >
              <Text style={styles.friendButtonText}>{compareButtonLabel}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.worldHeaderButton}>
              <View style={styles.regionControlWrap}>
                <Pressable
                  style={({ pressed }) => [styles.regionButton, pressed && styles.regionButtonPressed]}
                  onPress={() => setIsRegionMenuOpen((prev) => !prev)}
                >
                  <View style={styles.regionButtonContent}>
                    <Text style={styles.regionButtonText}>{countryGroup}</Text>
                    <Ionicons
                      name={isRegionMenuOpen ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.text}
                    />
                  </View>
                </Pressable>
                <Text style={styles.countryCountText}>{`${allCountries.length} countries`}</Text>
              </View>

              {isRegionMenuOpen ? (
                <View style={styles.regionMenu}>
                  <ScrollView style={styles.regionMenuList} nestedScrollEnabled>
                    {REGION_OPTIONS.map((option) => (
                      <Pressable
                        key={option}
                        style={({ pressed }) => [
                          styles.regionMenuItem,
                          option === countryGroup && styles.regionMenuItemSelected,
                          pressed && styles.regionMenuItemPressed,
                        ]}
                        onPress={() => {
                          setCountryGroup(option);
                          setIsRegionMenuOpen(false);
                        }}
                      >
                        <Text style={styles.regionMenuItemText}>{option}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            {hasComparison ? (
              <>
                <View style={styles.visitHeaderColumn}>
                  <View style={styles.visitHeaderContent}>
                    <Text style={styles.tableHeaderText}>You</Text>
                    <View style={styles.headerProgressRow}>
                      <View style={styles.headerProgressTrack}>
                        <View style={[styles.headerProgressFillYou, { width: `${userProgressPct}%` }]} />
                      </View>
                      <Text style={[styles.headerProgressCount, styles.headerProgressCountYou]}>
                        {userVisitedCountInView}
                      </Text>
                    </View>
                  </View>
                </View>

                {firstFriend ? (
                  <View style={styles.visitHeaderColumn}>
                    <View style={styles.visitHeaderContent}>
                    <Text style={styles.tableHeaderText} numberOfLines={1}>
                      {firstFriend.name}
                    </Text>
                      <View style={styles.headerProgressRow}>
                        <View style={styles.headerProgressTrack}>
                          <View style={[styles.headerProgressFillFriend, { width: `${firstFriendProgressPct}%` }]} />
                        </View>
                        <Text style={[styles.headerProgressCount, styles.headerProgressCountFriend]}>
                          {firstFriendCountInView}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {secondFriend ? (
                  <View style={styles.visitHeaderColumn}>
                    <View style={styles.visitHeaderContent}>
                    <Text style={styles.tableHeaderText} numberOfLines={1}>
                      {secondFriend.name}
                    </Text>
                      <View style={styles.headerProgressRow}>
                        <View style={styles.headerProgressTrack}>
                          <View style={[styles.headerProgressFillFriendTwo, { width: `${secondFriendProgressPct}%` }]} />
                        </View>
                        <Text style={[styles.headerProgressCount, styles.headerProgressCountFriendTwo]}>
                          {secondFriendCountInView}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.visitedHeader}>
                <View style={styles.visitHeaderContent}>
                  <Text style={styles.tableHeaderText}>Visited</Text>
                  <View style={styles.headerProgressRow}>
                    <View style={styles.headerProgressTrack}>
                      <View style={[styles.headerProgressFillYou, { width: `${userProgressPct}%` }]} />
                    </View>
                    <Text style={[styles.headerProgressCount, styles.headerProgressCountYou]}>
                      {userVisitedCountInView}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <ScrollView style={styles.tableScroll} contentContainerStyle={styles.tableScrollContent}>
            {allCountries.map((country, index) => {
              const isVisitedByUser = visitedSet.has(country.key);
              const isVisitedByFirstFriend = firstFriendSet.has(country.key);
              const isVisitedBySecondFriend = secondFriendSet.has(country.key);

              return (
                <View key={country.key} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={styles.countryNameCell}>
                    {country.displayName}
                  </Text>
                  {hasComparison ? (
                    <>
                      <View style={styles.visitCellColumn}>
                        {isVisitedByUser ? (
                          <View style={styles.visitedCheckBadge}>
                            <Ionicons name="checkmark" size={15} color={colors.primary} />
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.visitCellColumn}>
                        {isVisitedByFirstFriend ? (
                          <View style={styles.friendCheckBadge}>
                            <Ionicons name="checkmark" size={15} color="#dc2626" />
                          </View>
                        ) : null}
                      </View>
                      {secondFriend ? (
                        <View style={styles.visitCellColumn}>
                          {isVisitedBySecondFriend ? (
                            <View style={styles.friendTwoCheckBadge}>
                              <Ionicons name="checkmark" size={15} color="#15803d" />
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <View style={styles.visitedCell}>
                      {isVisitedByUser ? (
                        <View style={styles.visitedCheckBadge}>
                          <Ionicons name="checkmark" size={15} color={colors.primary} />
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        <Modal
          visible={isCompareModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCompareModalOpen(false)}
        >
          <View style={styles.compareOverlay}>
            <Pressable style={styles.compareBackdrop} onPress={() => setIsCompareModalOpen(false)} />
            <View style={styles.compareCard}>
              <Text style={styles.compareTitle}>Compare With Up To 2 Friends</Text>
              <Text style={styles.compareSubtitle}>Select one or two friends.</Text>
              {FRIENDS.map((friend) => {
                const isSelected = selectedFriendIds.includes(friend.id);
                const isDisabled = selectedFriendIds.length >= 2 && !isSelected;
                return (
                  <Pressable
                    key={friend.id}
                    style={({ pressed }) => [
                      styles.compareOption,
                      isSelected && styles.compareOptionSelected,
                      isDisabled && styles.compareOptionDisabled,
                      pressed && !isDisabled && styles.compareOptionPressed,
                    ]}
                    onPress={() => {
                      if (isDisabled) return;
                      setSelectedFriendIds((prev) => {
                        if (prev.includes(friend.id)) {
                          return prev.filter((id) => id !== friend.id);
                        }
                        return [...prev, friend.id];
                      });
                    }}
                  >
                    <Text style={styles.compareOptionName}>{friend.name}</Text>
                    <Text style={styles.compareOptionMeta}>{friend.visitedCountries.length} countries</Text>
                  </Pressable>
                );
              })}
              <Pressable
                style={({ pressed }) => [styles.compareDoneButton, pressed && styles.compareDoneButtonPressed]}
                onPress={() => setIsCompareModalOpen(false)}
              >
                <Text style={styles.compareDoneButtonText}>Done</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.compareClearButton, pressed && styles.compareClearButtonPressed]}
                onPress={() => {
                  setSelectedFriendIds([]);
                  setIsCompareModalOpen(false);
                }}
              >
                <Text style={styles.compareClearButtonText}>Clear comparison</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mutedText,
  },
  modeButtonTextActive: {
    color: colors.text,
  },
  legendRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  legendSwatchFriend: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  legendSwatchFriendTwo: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  legendSwatchBoth: {
    width: 14,
    height: 14,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2563eb',
  },
  legendSwatchAllThree: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#8b5cf6',
  },
  legendStripe: {
    position: 'absolute',
    width: 4,
    height: 20,
    backgroundColor: '#ef4444',
    transform: [{ rotate: '-35deg' }],
    top: -3,
  },
  legendStripeOne: {
    left: 0,
  },
  legendStripeTwo: {
    left: 5,
  },
  legendStripeThree: {
    left: 10,
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
  table: {
    marginTop: 14,
    marginBottom: 0,
    marginHorizontal: -20,
    flex: 1,
    borderWidth: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tableScroll: {
    flex: 1,
  },
  tableScrollContent: {
    paddingBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  worldHeaderButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    position: 'relative',
    zIndex: 3,
    minWidth: 0,
  },
  regionControlWrap: {
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  worldHeaderTopRow: {
    width: '100%',
  },
  regionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 2,
  },
  regionButtonPressed: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  regionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  regionButtonText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  countryCountText: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 10,
    textAlign: 'center',
    color: colors.mutedText,
    fontWeight: '600',
  },
  regionMenu: {
    position: 'absolute',
    top: 40,
    left: 12,
    minWidth: 180,
    maxHeight: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  regionMenuList: {
    maxHeight: 180,
  },
  regionMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  regionMenuItemSelected: {
    backgroundColor: '#eff6ff',
  },
  regionMenuItemPressed: {
    backgroundColor: '#f8fafc',
  },
  regionMenuItemText: {
    fontSize: 13,
    color: colors.text,
  },
  visitedHeader: {
    width: 92,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  visitHeaderColumn: {
    width: 88,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  visitHeaderContent: {
    width: '100%',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  headerProgressRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  headerProgressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  headerProgressFillYou: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  headerProgressFillFriend: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
  headerProgressFillFriendTwo: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  headerProgressCount: {
    minWidth: 14,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '600',
  },
  headerProgressCountYou: {
    color: '#2563eb',
  },
  headerProgressCountFriend: {
    color: '#ef4444',
  },
  headerProgressCountFriendTwo: {
    color: '#22c55e',
  },
  tableHeaderText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    maxWidth: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    overflow: 'hidden',
  },
  tableRowAlt: {
    backgroundColor: '#fcfdff',
  },
  countryNameCell: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  visitedCell: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#f1f5f9',
    alignSelf: 'stretch',
  },
  visitCellColumn: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#f1f5f9',
    alignSelf: 'stretch',
  },
  visitedCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  friendCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  friendTwoCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  compareOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  compareBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.42)',
  },
  compareCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 8,
  },
  compareTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  compareSubtitle: {
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 4,
  },
  compareOption: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  compareOptionSelected: {
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
  },
  compareOptionPressed: {
    backgroundColor: '#f8fafc',
  },
  compareOptionDisabled: {
    opacity: 0.45,
  },
  compareOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  compareOptionMeta: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  compareDoneButton: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  compareDoneButtonPressed: {
    backgroundColor: '#dbeafe',
  },
  compareDoneButtonText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '600',
  },
  compareClearButton: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  compareClearButtonPressed: {
    backgroundColor: '#ffe4e6',
  },
  compareClearButtonText: {
    color: '#be123c',
    fontSize: 13,
    fontWeight: '600',
  },
});
