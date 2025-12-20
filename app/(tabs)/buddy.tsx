import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Users, Search, Filter, X, MapPin, Award, Globe } from 'lucide-react-native';
import { colors, spacing, typography } from '../../constants/theme';
import Button from '../../components/Button';
import { useLocation } from '../../hooks/useLocation';
import {
  createBuddyProfile,
  getMyBuddyProfile,
  searchBuddies,
  searchInstructors,
  deleteBuddyProfile,
  CreateBuddyProfileData,
  SearchFilters,
} from '../../services/buddyProfiles';
import { BuddyProfile, DivingSpecialty, UserRole } from '../../packages/core/types';
import {
  CERTIFICATION_ORGS,
  CERTIFICATION_LEVELS,
  DIVING_SPECIALTIES,
  DIVING_LOCATIONS,
  LANGUAGES,
  getCertificationOrgLabel,
  getCertificationLevelLabel,
  getSpecialtyLabel,
  getCountryFlag,
} from '../../packages/core/buddyConstants';
import { sendContactRequest, createDirectConversation } from '../../services/messaging';
import { getCurrentUserProfile } from '../../services/auth';

export default function BuddyScreen() {
  const router = useRouter();
  const [myProfile, setMyProfile] = useState<BuddyProfile | null>(null);
  const [buddies, setBuddies] = useState<BuddyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchMode, setSearchMode] = useState<'buddies' | 'instructors'>('buddies');
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);
  const { location, hasPermission, requestPermission, getCurrentLocation } = useLocation();

  // Search filters
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Form state for creating profile
  const [formData, setFormData] = useState<Partial<CreateBuddyProfileData>>({
    displayName: '',
    role: 'DIVER',
    certificationOrg: 'PADI',
    certificationLevel: 'OPEN_WATER',
    experienceDives: 0,
    specialties: [],
    languages: ['en'],
    country: 'TR',
    city: 'Istanbul',
    availableHours: 24,
    bio: '',
  });

  useEffect(() => {
    loadMyProfile();
  }, []);

  const loadMyProfile = async () => {
    try {
      const profile = await getMyBuddyProfile();
      setMyProfile(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSendContactRequest = async (buddyId: string, buddyName: string) => {
    try {
      // Get current user profile
      const currentUser = await getCurrentUserProfile();
      if (!currentUser) {
        Alert.alert('Error', 'Please sign in to send contact requests');
        return;
      }

      // Check if we need to convert buddy profile ID to user ID
      // For now, we'll assume buddyId is the user_id or we need to look it up
      // This is a simplified version - you might need to adjust based on your data model

      setSendingRequestId(buddyId);

      await sendContactRequest({
        fromUserId: currentUser.id,
        toUserId: buddyId,
        message: `Hi! I'd like to connect with you on ScuPlan.`,
        context: 'buddy_finder',
        metadata: { source: searchMode },
      });

      Alert.alert(
        'Request Sent',
        `Contact request sent to ${buddyName}!`,
        [
          {
            text: 'View Requests',
            onPress: () => router.push('/contact-requests'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to send contact request:', error);

      if (error.message?.includes('duplicate')) {
        Alert.alert('Already Sent', 'You already sent a contact request to this user');
      } else {
        Alert.alert('Error', 'Failed to send contact request. Please try again.');
      }
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleSearch = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Location permission is needed to find buddies nearby');
        return;
      }
    }

    setLoading(true);
    try {
      const currentLoc = await getCurrentLocation();

      const searchFilters: SearchFilters = {
        ...filters,
        latitude: currentLoc?.lat,
        longitude: currentLoc?.lon,
        radiusMeters: 50000, // 50km radius
      };

      if (selectedCountry) {
        searchFilters.country = selectedCountry;
      }
      if (selectedCity) {
        searchFilters.city = selectedCity;
      }

      const results = searchMode === 'instructors'
        ? await searchInstructors(searchFilters)
        : await searchBuddies(searchFilters);

      setBuddies(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search for buddies');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!formData.displayName || formData.displayName.length === 0) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Error', 'Location permission is required');
        return;
      }
    }

    setLoading(true);
    try {
      const currentLoc = await getCurrentLocation();
      if (!currentLoc) {
        Alert.alert('Error', 'Could not get current location');
        return;
      }

      const profileData: CreateBuddyProfileData = {
        displayName: formData.displayName!,
        role: formData.role!,
        certificationOrg: formData.certificationOrg!,
        certificationLevel: formData.certificationLevel!,
        experienceDives: formData.experienceDives!,
        specialties: formData.specialties!,
        languages: formData.languages!,
        country: formData.country!,
        city: formData.city!,
        region: formData.region,
        latitude: currentLoc.lat,
        longitude: currentLoc.lon,
        availableHours: formData.availableHours!,
        bio: formData.bio,
      };

      const profile = await createBuddyProfile(profileData);
      setMyProfile(profile);
      setShowCreateForm(false);
      Alert.alert('Success', 'Your buddy profile has been created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your buddy profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBuddyProfile();
              setMyProfile(null);
              Alert.alert('Success', 'Profile deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile');
            }
          },
        },
      ]
    );
  };

  const renderMyProfile = () => {
    if (!myProfile) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Profile</Text>
          <Text style={styles.infoText}>
            You don't have a buddy profile yet. Create one to find dive buddies!
          </Text>
          <Button
            title="Create Profile"
            onPress={() => setShowCreateForm(true)}
            variant="primary"
          />
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Profile</Text>
          <TouchableOpacity onPress={handleDeleteProfile}>
            <X size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{myProfile.displayName}</Text>
          <Text style={styles.profileRole}>
            {myProfile.isInstructor ? '👨‍🏫 Instructor' : '🤿 Diver'}
          </Text>
          <View style={styles.profileDetails}>
            <Text style={styles.profileDetail}>
              {getCountryFlag(myProfile.location.country)} {myProfile.location.city}
            </Text>
            <Text style={styles.profileDetail}>
              {getCertificationOrgLabel(myProfile.certificationOrg)} •{' '}
              {getCertificationLevelLabel(myProfile.certificationLevel)}
            </Text>
            <Text style={styles.profileDetail}>
              {myProfile.experienceDives} dives
            </Text>
          </View>
          {myProfile.specialties.length > 0 && (
            <View style={styles.specialtyContainer}>
              {myProfile.specialties.map((specialty, idx) => (
                <View key={idx} style={styles.specialtyChip}>
                  <Text style={styles.specialtyText}>{getSpecialtyLabel(specialty)}</Text>
                </View>
              ))}
            </View>
          )}
          {myProfile.bio && <Text style={styles.profileBio}>{myProfile.bio}</Text>}
        </View>
      </View>
    );
  };

  const renderSearchFilters = () => {
    const selectedCountryData = DIVING_LOCATIONS.find(l => l.countryCode === selectedCountry);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Search Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Filter size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchModeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, searchMode === 'buddies' && styles.modeButtonActive]}
            onPress={() => setSearchMode('buddies')}
          >
            <Users size={20} color={searchMode === 'buddies' ? colors.white : colors.primary} />
            <Text style={[styles.modeButtonText, searchMode === 'buddies' && styles.modeButtonTextActive]}>
              Find Buddies
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, searchMode === 'instructors' && styles.modeButtonActive]}
            onPress={() => setSearchMode('instructors')}
          >
            <Award size={20} color={searchMode === 'instructors' ? colors.white : colors.primary} />
            <Text style={[styles.modeButtonText, searchMode === 'instructors' && styles.modeButtonTextActive]}>
              Find Instructors
            </Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>Country</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {DIVING_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc.countryCode}
                  style={[
                    styles.filterChip,
                    selectedCountry === loc.countryCode && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setSelectedCountry(loc.countryCode);
                    setSelectedCity('');
                  }}
                >
                  <Text style={styles.filterChipText}>
                    {loc.flag} {loc.country}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedCountryData && (
              <>
                <Text style={styles.filterLabel}>City</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {selectedCountryData.cities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.filterChip,
                        selectedCity === city && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedCity(city)}
                    >
                      <Text style={styles.filterChipText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}

        <Button
          title="Search"
          onPress={handleSearch}
          variant="primary"
          loading={loading}
        />
      </View>
    );
  };

  const renderBuddyList = () => {
    if (buddies.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Users size={64} color={colors.text.secondary} />
          <Text style={styles.emptyText}>
            No {searchMode === 'instructors' ? 'instructors' : 'buddies'} found
          </Text>
          <Text style={styles.emptyHint}>
            Try adjusting your search filters or location
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {searchMode === 'instructors' ? 'Instructors' : 'Dive Buddies'} ({buddies.length})
        </Text>
        {buddies.map((buddy) => (
          <View key={buddy.id} style={styles.buddyCard}>
            <View style={styles.buddyHeader}>
              <Text style={styles.buddyName}>{buddy.displayName}</Text>
              {buddy.isInstructor && (
                <View style={styles.instructorBadge}>
                  <Award size={16} color={colors.primary} />
                  <Text style={styles.instructorText}>Instructor</Text>
                </View>
              )}
            </View>

            <View style={styles.buddyDetails}>
              <View style={styles.buddyDetail}>
                <MapPin size={16} color={colors.text.secondary} />
                <Text style={styles.buddyDetailText}>
                  {getCountryFlag(buddy.location.country)} {buddy.location.city}
                </Text>
              </View>

              <View style={styles.buddyDetail}>
                <Globe size={16} color={colors.text.secondary} />
                <Text style={styles.buddyDetailText}>
                  {getCertificationOrgLabel(buddy.certificationOrg)} •{' '}
                  {getCertificationLevelLabel(buddy.certificationLevel)}
                </Text>
              </View>

              <Text style={styles.buddyDetailText}>
                {buddy.experienceDives} dives • {buddy.languages.join(', ')}
              </Text>
            </View>

            {buddy.specialties.length > 0 && (
              <View style={styles.specialtyContainer}>
                {buddy.specialties.slice(0, 3).map((specialty, idx) => (
                  <View key={idx} style={styles.specialtyChipSmall}>
                    <Text style={styles.specialtyTextSmall}>{getSpecialtyLabel(specialty)}</Text>
                  </View>
                ))}
                {buddy.specialties.length > 3 && (
                  <Text style={styles.moreText}>+{buddy.specialties.length - 3} more</Text>
                )}
              </View>
            )}

            {buddy.bio && (
              <Text style={styles.buddyBio} numberOfLines={2}>{buddy.bio}</Text>
            )}

            <Button
              title={sendingRequestId === buddy.id ? 'Sending...' : 'Send Contact Request'}
              onPress={() => handleSendContactRequest(buddy.id, buddy.displayName)}
              variant="secondary"
              size="small"
              loading={sendingRequestId === buddy.id}
            />
          </View>
        ))}
      </View>
    );
  };

  if (showCreateForm) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Buddy Profile</Text>
          <TouchableOpacity onPress={() => setShowCreateForm(false)}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.displayName}
            onChangeText={(text) => setFormData({ ...formData, displayName: text })}
            placeholder="Enter your dive name"
            maxLength={50}
          />

          <Text style={styles.label}>I am a *</Text>
          <View style={styles.roleContainer}>
            {['DIVER', 'INSTRUCTOR'].map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleButton, formData.role === role && styles.roleButtonActive]}
                onPress={() => setFormData({ ...formData, role: role as UserRole })}
              >
                <Text style={[styles.roleButtonText, formData.role === role && styles.roleButtonTextActive]}>
                  {role === 'DIVER' ? '🤿 Diver' : '👨‍🏫 Instructor'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Certification Organization *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {CERTIFICATION_ORGS.map((org) => (
              <TouchableOpacity
                key={org.value}
                style={[styles.filterChip, formData.certificationOrg === org.value && styles.filterChipActive]}
                onPress={() => setFormData({ ...formData, certificationOrg: org.value })}
              >
                <Text style={styles.filterChipText}>{org.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Certification Level *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {CERTIFICATION_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[styles.filterChip, formData.certificationLevel === level.value && styles.filterChipActive]}
                onPress={() => setFormData({ ...formData, certificationLevel: level.value })}
              >
                <Text style={styles.filterChipText}>{level.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Location *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {DIVING_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.countryCode}
                style={[styles.filterChip, formData.country === loc.countryCode && styles.filterChipActive]}
                onPress={() => setFormData({ ...formData, country: loc.countryCode, city: loc.cities[0] })}
              >
                <Text style={styles.filterChipText}>{loc.flag} {loc.country}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {formData.country && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {DIVING_LOCATIONS.find(l => l.countryCode === formData.country)?.cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.filterChip, formData.city === city && styles.filterChipActive]}
                  onPress={() => setFormData({ ...formData, city })}
                >
                  <Text style={styles.filterChipText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.label}>Bio (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Tell others about yourself..."
            multiline
            maxLength={500}
            numberOfLines={4}
          />

          <Button
            title="Create Profile"
            onPress={handleCreateProfile}
            variant="primary"
            loading={loading}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Buddy Finder</Text>
      </View>

      {renderMyProfile()}
      {renderSearchFilters()}
      {renderBuddyList()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  infoText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
  },
  profileName: {
    ...typography.h2,
    color: colors.text.primary,
  },
  profileRole: {
    ...typography.body,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  profileDetails: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  profileDetail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  profileBio: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  searchModeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  modeButtonTextActive: {
    color: colors.white,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  horizontalScroll: {
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  buddyCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  buddyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  buddyName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  instructorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  instructorText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  buddyDetails: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  buddyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  buddyDetailText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  buddyBio: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  specialtyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  specialtyChip: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  specialtyChipSmall: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  specialtyTextSmall: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  moreText: {
    fontSize: 10,
    color: colors.text.secondary,
    alignSelf: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  form: {
    padding: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  roleButtonTextActive: {
    color: colors.white,
  },
});
