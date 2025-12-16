import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Users, MapPin, Award, MessageSquare } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import Button from '../../components/Button';
import { BuddyProfile } from '../../packages/core/types';
import {
  createBuddyProfile,
  getMyBuddyProfile,
  searchBuddies,
  deleteBuddyProfile,
} from '../../services/buddyProfiles';
import { sendContactRequest } from '../../services/contactRequests';
import { useLocation } from '../../hooks/useLocation';
import { CERTIFICATION_LEVELS } from '../../packages/core/constants';

export default function BuddyScreen() {
  const [myProfile, setMyProfile] = useState<BuddyProfile | null>(null);
  const [buddies, setBuddies] = useState<BuddyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { location, hasPermission, requestPermission, getCurrentLocation } = useLocation();

  useEffect(() => {
    loadMyProfile();
  }, []);

  const loadMyProfile = async () => {
    try {
      const profile = await getMyBuddyProfile();
      setMyProfile(profile);
    } catch (error) {
      console.error('Failed to load buddy profile:', error);
    }
  };

  const handleCreateProfile = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Error', 'Location permission is required');
        return;
      }
    }

    const currentLoc = await getCurrentLocation();
    if (!currentLoc) {
      Alert.alert('Error', 'Could not get current location');
      return;
    }

    // For demo purposes, using hardcoded values
    // In production, this would show a form modal
    try {
      setLoading(true);
      await createBuddyProfile({
        displayName: 'Diver',
        certification: 'PADI_ADVANCED',
        experienceDives: 50,
        languages: ['en'],
        latitude: currentLoc.lat,
        longitude: currentLoc.lon,
        availableHours: 8,
      });
      await loadMyProfile();
      Alert.alert('Success', 'Buddy profile created!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchBuddies = async () => {
    if (!location) {
      Alert.alert('Error', 'Waiting for GPS location...');
      return;
    }

    try {
      setLoading(true);
      const found = await searchBuddies(location.lat, location.lon);
      setBuddies(found);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to search buddies');
    } finally {
      setLoading(false);
    }
  };

  const handleContactBuddy = async (buddy: BuddyProfile) => {
    try {
      await sendContactRequest(buddy.id, 'Hello, want to dive together?');
      Alert.alert('Success', 'Contact request sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send request');
    }
  };

  const handleDeleteProfile = async () => {
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
              setBuddies([]);
              Alert.alert('Success', 'Profile deleted');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete profile');
            }
          },
        },
      ]
    );
  };

  const renderBuddy = ({ item }: { item: BuddyProfile }) => (
    <View style={styles.buddyCard}>
      <View style={styles.buddyHeader}>
        <View style={styles.buddyIcon}>
          <Users size={32} color={colors.primary} />
        </View>
        <View style={styles.buddyInfo}>
          <Text style={styles.buddyName}>{item.displayName}</Text>
          <View style={styles.buddyDetail}>
            <Award size={14} color={colors.text.secondary} />
            <Text style={styles.buddyDetailText}>
              {CERTIFICATION_LEVELS[item.certification]}
            </Text>
          </View>
          <Text style={styles.buddyDives}>{item.experienceDives} dives</Text>
        </View>
      </View>

      <View style={styles.languagesContainer}>
        {item.languages.map((lang) => (
          <View key={lang} style={styles.languageChip}>
            <Text style={styles.languageText}>{lang.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <Button
        title="Send Contact Request"
        onPress={() => handleContactBuddy(item)}
        variant="secondary"
        size="small"
        style={styles.contactButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buddy Finder</Text>
      </View>

      <ScrollView style={styles.content}>
        {!myProfile ? (
          <View style={styles.setupCard}>
            <Users size={64} color={colors.primary} />
            <Text style={styles.setupTitle}>Create Your Buddy Profile</Text>
            <Text style={styles.setupText}>
              Let other divers find you and plan dives together
            </Text>
            <Button
              title="Create Profile"
              onPress={handleCreateProfile}
              variant="primary"
              size="large"
              loading={loading}
              style={styles.setupButton}
            />
          </View>
        ) : (
          <>
            <View style={styles.myProfileCard}>
              <Text style={styles.sectionTitle}>Your Profile</Text>
              <View style={styles.myProfileContent}>
                <Text style={styles.myProfileName}>{myProfile.displayName}</Text>
                <Text style={styles.myProfileCert}>
                  {CERTIFICATION_LEVELS[myProfile.certification]}
                </Text>
                <Text style={styles.myProfileDives}>
                  {myProfile.experienceDives} dives
                </Text>
              </View>
              <View style={styles.profileActions}>
                <Button
                  title="Search Buddies"
                  onPress={handleSearchBuddies}
                  variant="primary"
                  size="medium"
                  loading={loading}
                  style={styles.searchButton}
                />
                <Button
                  title="Delete"
                  onPress={handleDeleteProfile}
                  variant="outline"
                  size="small"
                />
              </View>
            </View>

            {buddies.length > 0 && (
              <View style={styles.buddiesSection}>
                <Text style={styles.sectionTitle}>Nearby Buddies ({buddies.length})</Text>
                <FlatList
                  data={buddies}
                  renderItem={renderBuddy}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {buddies.length === 0 && (
              <View style={styles.emptyState}>
                <MapPin size={48} color={colors.text.secondary} />
                <Text style={styles.emptyText}>
                  No buddies found nearby. Try searching again.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  setupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  setupTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  setupText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  setupButton: {
    minWidth: 200,
  },
  myProfileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  myProfileContent: {
    marginBottom: spacing.md,
  },
  myProfileName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  myProfileCert: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  myProfileDives: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchButton: {
    flex: 1,
  },
  buddiesSection: {
    marginTop: spacing.md,
  },
  buddyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  buddyHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  buddyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.underwater.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  buddyInfo: {
    flex: 1,
  },
  buddyName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  buddyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  buddyDetailText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  buddyDives: {
    ...typography.caption,
    color: colors.primary,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  languageChip: {
    backgroundColor: colors.underwater.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  languageText: {
    ...typography.caption,
    color: colors.underwater.darkBlue,
    fontWeight: '600',
  },
  contactButton: {
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
