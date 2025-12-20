import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Dimensions } from 'react-native';
import { colors } from '../../constants/theme';
import { Users, GraduationCap, MapPin, Award, Search, Map } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getNearbyBuddies } from '../../services/nearbyBuddies';
import { BuddyProfile } from '../../packages/core/types';
import MapView, { Marker } from '../../components/MapView';

export default function BuddyScreen() {
  const [buddies, setBuddies] = useState<BuddyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstructors, setFilterInstructors] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadBuddies();
  }, []);

  const loadBuddies = async () => {
    try {
      const fetchedBuddies = await getNearbyBuddies({ radiusKm: 50 });
      setBuddies(fetchedBuddies);
    } catch (error) {
      console.error('Failed to load buddies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBuddies = buddies.filter(buddy => {
    const matchesSearch = buddy.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buddy.location.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterInstructors || buddy.isInstructor;
    return matchesSearch && matchesFilter;
  });

  const instructors = filteredBuddies.filter(b => b.isInstructor);
  const divers = filteredBuddies.filter(b => !b.isInstructor);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Buddy Finder</Text>
          <Text style={styles.subtitle}>{filteredBuddies.length} nearby</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.mapToggle,
            pressed && styles.mapTogglePressed
          ]}
          onPress={() => setShowMap(!showMap)}
        >
          <Map size={24} color={showMap ? colors.primary : colors.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or location..."
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.filterRow}>
          <Pressable
            style={({ pressed }) => [
              styles.filterChip,
              !filterInstructors && styles.filterChipActive,
              pressed && styles.filterChipPressed
            ]}
            onPress={() => setFilterInstructors(false)}
          >
            <Users size={16} color={!filterInstructors ? '#FFFFFF' : colors.text.secondary} />
            <Text style={[
              styles.filterText,
              !filterInstructors && styles.filterTextActive
            ]}>All ({buddies.length})</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.filterChip,
              filterInstructors && styles.filterChipActive,
              pressed && styles.filterChipPressed
            ]}
            onPress={() => setFilterInstructors(true)}
          >
            <GraduationCap size={16} color={filterInstructors ? '#FFFFFF' : colors.text.secondary} />
            <Text style={[
              styles.filterText,
              filterInstructors && styles.filterTextActive
            ]}>Instructors ({instructors.length})</Text>
          </Pressable>
        </View>
      </View>

      {showMap && filteredBuddies.length > 0 && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: filteredBuddies[0].location.gridLat,
              longitude: filteredBuddies[0].location.gridLon,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            }}
          >
            {filteredBuddies.map(buddy => (
              <Marker
                key={buddy.id}
                coordinate={{
                  latitude: buddy.location.gridLat,
                  longitude: buddy.location.gridLon,
                }}
                title={buddy.displayName}
                description={`${buddy.certificationLevel} • ${buddy.experienceDives} dives`}
                pinColor={buddy.isInstructor ? colors.secondary : colors.primary}
              />
            ))}
          </MapView>
        </View>
      )}

      <ScrollView style={styles.content}>
        {filterInstructors && instructors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructors</Text>
            {instructors.map(buddy => (
              <BuddyCard key={buddy.id} buddy={buddy} />
            ))}
          </View>
        )}

        {!filterInstructors && (
          <>
            {instructors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructors</Text>
                {instructors.map(buddy => (
                  <BuddyCard key={buddy.id} buddy={buddy} />
                ))}
              </View>
            )}

            {divers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Divers</Text>
                {divers.map(buddy => (
                  <BuddyCard key={buddy.id} buddy={buddy} />
                ))}
              </View>
            )}
          </>
        )}

        {filteredBuddies.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>No divers found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search' : 'No divers nearby at the moment'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function BuddyCard({ buddy }: { buddy: BuddyProfile }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardName}>{buddy.displayName}</Text>
          {buddy.isInstructor && (
            <View style={styles.badge}>
              <GraduationCap size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>Instructor</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardDetail}>
        <MapPin size={14} color={colors.text.secondary} />
        <Text style={styles.cardDetailText}>
          {buddy.location.city}, {buddy.location.country}
        </Text>
      </View>

      <View style={styles.cardDetail}>
        <Award size={14} color={colors.text.secondary} />
        <Text style={styles.cardDetailText}>
          {buddy.certificationLevel} • {buddy.experienceDives} dives
        </Text>
      </View>

      {buddy.specialties.length > 0 && (
        <View style={styles.specialties}>
          {buddy.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={styles.specialtyChip}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  mapToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  mapTogglePressed: {
    opacity: 0.7,
  },
  mapContainer: {
    height: 250,
    backgroundColor: colors.surface,
  },
  map: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipPressed: {
    opacity: 0.7,
  },
  filterText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardDetailText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  specialtyChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specialtyText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
