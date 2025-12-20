import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  User,
  Shield,
  MapPin,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit,
  Trash2,
  Phone,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../../constants/theme';
import Button from '../../components/Button';
import {
  getCurrentUserProfile,
  updateUserProfile,
  signOut,
  getUserConsents,
} from '../../services/auth';
import { UserProfile, UserConsent } from '../../packages/core/types';
import { stopSharingLocation } from '../../services/nearbyBuddies';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      if (userProfile) {
        setProfile(userProfile);
        const userConsents = await getUserConsents(userProfile.id);
        setConsents(userConsents);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (
    field: keyof UserProfile,
    value: boolean
  ) => {
    if (!profile) return;

    try {
      const updates = { [field]: value } as Partial<UserProfile>;
      const updated = await updateUserProfile(profile.id, updates);
      setProfile(updated);

      // If disabling location sharing, also stop sharing location
      if (field === 'locationSharingEnabled' && !value) {
        await stopSharingLocation(profile.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
      console.error(error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/welcome');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I Understand',
                  style: 'destructive',
                  onPress: async () => {
                    // TODO: Implement account deletion
                    Alert.alert('Coming Soon', 'Account deletion will be available soon. Please contact support.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Welcome to ScuPlan</Text>
          <View style={styles.infoCard}>
            <Text style={styles.aboutText}>
              To access settings and personalize your experience, you'll need to sign in or create an account.
            </Text>
          </View>

          <Button
            title="Sign In"
            onPress={() => router.push('/welcome')}
            variant="primary"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Linking.openURL('https://scuplan.app/privacy')}
          >
            <View style={styles.settingLeft}>
              <Shield size={20} color={colors.text.secondary} />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <ChevronRight size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Linking.openURL('https://scuplan.app/terms')}
          >
            <View style={styles.settingLeft}>
              <Shield size={20} color={colors.text.secondary} />
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <ChevronRight size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Linking.openURL('mailto:support@scuplan.app')}
          >
            <View style={styles.settingLeft}>
              <HelpCircle size={20} color={colors.text.secondary} />
              <Text style={styles.settingText}>Contact Support</Text>
            </View>
            <ChevronRight size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>ScuPlan v1.0.0</Text>
          <Text style={styles.appInfoText}>Made for divers</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => router.push('/profile-edit')}
        >
          <View style={styles.settingLeft}>
            <Edit size={20} color={colors.text.secondary} />
            <Text style={styles.settingText}>Edit Profile</Text>
          </View>
          <ChevronRight size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>
            {profile.displayName || profile.fullName || 'Not set'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile.email}</Text>
        </View>

        {profile.emergencyContactName && (
          <View style={styles.infoCard}>
            <View style={styles.emergencyHeader}>
              <Phone size={16} color={colors.error} />
              <Text style={styles.emergencyTitle}>Emergency Contact</Text>
            </View>
            <Text style={styles.infoValue}>{profile.emergencyContactName}</Text>
            {profile.emergencyContactPhone && (
              <Text style={styles.infoSubValue}>{profile.emergencyContactPhone}</Text>
            )}
          </View>
        )}
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Safety</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Shield size={20} color={colors.text.secondary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Profile Visible</Text>
              <Text style={styles.settingSubtext}>
                Other users can see your profile
              </Text>
            </View>
          </View>
          <Switch
            value={profile.profileVisible}
            onValueChange={(value) => handleToggle('profileVisible', value)}
            trackColor={{ false: colors.divider, true: colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <MapPin size={20} color={colors.text.secondary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Location Sharing</Text>
              <Text style={styles.settingSubtext}>
                Share real-time location with nearby divers
              </Text>
            </View>
          </View>
          <Switch
            value={profile.locationSharingEnabled}
            onValueChange={(value) => handleToggle('locationSharingEnabled', value)}
            trackColor={{ false: colors.divider, true: colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <User size={20} color={colors.text.secondary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Show Real Name</Text>
              <Text style={styles.settingSubtext}>
                Display full name instead of username
              </Text>
            </View>
          </View>
          <Switch
            value={profile.showRealName}
            onValueChange={(value) => handleToggle('showRealName', value)}
            trackColor={{ false: colors.divider, true: colors.primary }}
          />
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Bell size={20} color={colors.text.secondary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Marketing Communications</Text>
              <Text style={styles.settingSubtext}>
                Receive news and updates
              </Text>
            </View>
          </View>
          <Switch
            value={profile.marketingConsent}
            onValueChange={(value) => handleToggle('marketingConsent', value)}
            trackColor={{ false: colors.divider, true: colors.primary }}
          />
        </View>
      </View>

      {/* Legal & Consents Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal & Consent</Text>

        <View style={styles.consentStatus}>
          <Text style={styles.consentLabel}>GDPR Consent</Text>
          <Text style={[styles.consentValue, profile.gdprConsentGiven && styles.consentGranted]}>
            {profile.gdprConsentGiven ? '✓ Granted' : '✗ Not Granted'}
          </Text>
        </View>

        <View style={styles.consentStatus}>
          <Text style={styles.consentLabel}>KVKK Consent</Text>
          <Text style={[styles.consentValue, profile.kvkkConsentGiven && styles.consentGranted]}>
            {profile.kvkkConsentGiven ? '✓ Granted' : '✗ Not Granted'}
          </Text>
        </View>

        <View style={styles.consentStatus}>
          <Text style={styles.consentLabel}>Terms Accepted</Text>
          <Text style={[styles.consentValue, profile.termsAccepted && styles.consentGranted]}>
            {profile.termsAccepted ? '✓ Accepted' : '✗ Not Accepted'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL('https://scuplan.app/privacy')}
        >
          <Text style={styles.linkButtonText}>Privacy Policy</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL('https://scuplan.app/terms')}
        >
          <Text style={styles.linkButtonText}>Terms of Service</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => Linking.openURL('mailto:support@scuplan.app')}
        >
          <View style={styles.settingLeft}>
            <HelpCircle size={20} color={colors.text.secondary} />
            <Text style={styles.settingText}>Contact Support</Text>
          </View>
          <ChevronRight size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
        />

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleDeleteAccount}
        >
          <Trash2 size={20} color={colors.error} />
          <Text style={styles.dangerButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>ScuPlan v1.0.0</Text>
        <Text style={styles.appInfoText}>Made with ❤️ for divers</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    ...typography.body,
    color: colors.text.primary,
  },
  settingSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  infoSubValue: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 4,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  emergencyTitle: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  consentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  consentLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  consentValue: {
    ...typography.body,
    color: colors.error,
  },
  consentGranted: {
    color: colors.success,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  linkButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerButtonText: {
    ...typography.button,
    color: colors.error,
  },
  appInfo: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  appInfoText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  aboutText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
