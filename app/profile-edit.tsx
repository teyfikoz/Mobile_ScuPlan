import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image as RNImage,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Upload, User, Phone, Award } from 'lucide-react-native';
import { colors, spacing, typography } from '../constants/theme';
import Button from '../components/Button';
import { getCurrentUserProfile, updateUserProfile } from '../services/auth';
import { UserProfile, CertificationOrganization, CertificationLevel, DivingSpecialty } from '../packages/core/types';
import {
  CERTIFICATION_ORGS,
  CERTIFICATION_LEVELS,
  DIVING_SPECIALTIES,
  DIVING_LOCATIONS,
} from '../packages/core/buddyConstants';
import { supabase } from '../lib/supabase';

export default function ProfileEditScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [certificationOrg, setCertificationOrg] = useState('');
  const [certificationLevel, setCertificationLevel] = useState('');
  const [experienceDives, setExperienceDives] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    loadProfile();
    requestImagePermissions();
  }, []);

  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library permission to upload profile pictures'
      );
    }
  };

  const loadProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      if (!userProfile) {
        setLoading(false);
        return;
      }

      setProfile(userProfile);
      setDisplayName(userProfile.displayName || '');
      setFullName(userProfile.fullName || '');
      setPhone(userProfile.phone || '');
      setCountry(userProfile.country || '');
      setCity(userProfile.city || '');
      setCertificationOrg(userProfile.certificationOrg || '');
      setCertificationLevel(userProfile.certificationLevel || '');
      setExperienceDives(userProfile.experienceDives?.toString() || '0');
      setSpecialties(userProfile.specialties || []);
      setEmergencyContactName(userProfile.emergencyContactName || '');
      setEmergencyContactPhone(userProfile.emergencyContactPhone || '');
      setEmergencyContactRelation(userProfile.emergencyContactRelation || '');
      setAvatarUrl(userProfile.avatarUrl || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permission');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!profile) return;

    setUploadingImage(true);
    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `${profile.id}-${Date.now()}.jpg`;
      const filePath = `avatars/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrlData.publicUrl);
      Alert.alert('Success', 'Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display name is required');
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<UserProfile> = {
        displayName: displayName.trim(),
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        country: country || undefined,
        city: city || undefined,
        certificationOrg: (certificationOrg as CertificationOrganization) || undefined,
        certificationLevel: (certificationLevel as CertificationLevel) || undefined,
        experienceDives: parseInt(experienceDives) || 0,
        specialties: specialties as DivingSpecialty[],
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        emergencyContactRelation: emergencyContactRelation.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      };

      await updateUserProfile(profile.id, updates);

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter((s) => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Picture */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <RNImage source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={48} color={colors.text.secondary} />
              </View>
            )}
            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            )}
          </View>

          <View style={styles.avatarButtons}>
            <TouchableOpacity style={styles.avatarButton} onPress={takePhoto}>
              <Camera size={20} color={colors.primary} />
              <Text style={styles.avatarButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
              <Upload size={20} color={colors.primary} />
              <Text style={styles.avatarButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your dive name"
            maxLength={50}
          />

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            maxLength={100}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+90 555 123 4567"
            keyboardType="phone-pad"
            maxLength={20}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Text style={styles.label}>Country</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {DIVING_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.countryCode}
                style={[styles.chip, country === loc.countryCode && styles.chipActive]}
                onPress={() => {
                  setCountry(loc.countryCode);
                  setCity(loc.cities[0]);
                }}
              >
                <Text style={styles.chipText}>
                  {loc.flag} {loc.country}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {country && (
            <>
              <Text style={styles.label}>City</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {DIVING_LOCATIONS.find((l) => l.countryCode === country)?.cities.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, city === c && styles.chipActive]}
                    onPress={() => setCity(c)}
                  >
                    <Text style={styles.chipText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Diving Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diving Credentials</Text>

          <Text style={styles.label}>Certification Organization</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {CERTIFICATION_ORGS.map((org) => (
              <TouchableOpacity
                key={org.value}
                style={[styles.chip, certificationOrg === org.value && styles.chipActive]}
                onPress={() => setCertificationOrg(org.value)}
              >
                <Text style={styles.chipText}>{org.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Certification Level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {CERTIFICATION_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[styles.chip, certificationLevel === level.value && styles.chipActive]}
                onPress={() => setCertificationLevel(level.value)}
              >
                <Text style={styles.chipText}>{level.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Experience Dives</Text>
          <TextInput
            style={styles.input}
            value={experienceDives}
            onChangeText={setExperienceDives}
            placeholder="0"
            keyboardType="number-pad"
            maxLength={5}
          />

          <Text style={styles.label}>Specialties</Text>
          <View style={styles.specialtiesGrid}>
            {DIVING_SPECIALTIES.map((specialty) => (
              <TouchableOpacity
                key={specialty.value}
                style={[
                  styles.specialtyChip,
                  specialties.includes(specialty.value) && styles.specialtyChipActive,
                ]}
                onPress={() => toggleSpecialty(specialty.value)}
              >
                <Text style={styles.specialtyIcon}>{specialty.icon}</Text>
                <Text style={styles.specialtyLabel}>{specialty.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Phone size={20} color={colors.error} />
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={emergencyContactName}
            onChangeText={setEmergencyContactName}
            placeholder="Emergency contact name"
            maxLength={100}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={emergencyContactPhone}
            onChangeText={setEmergencyContactPhone}
            placeholder="+90 555 123 4567"
            keyboardType="phone-pad"
            maxLength={20}
          />

          <Text style={styles.label}>Relation</Text>
          <TextInput
            style={styles.input}
            value={emergencyContactRelation}
            onChangeText={setEmergencyContactRelation}
            placeholder="Spouse, Parent, Friend, etc."
            maxLength={50}
          />
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button title="Save Changes" onPress={handleSave} loading={saving} variant="primary" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  avatarButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    color: colors.text.primary,
  },
  horizontalScroll: {
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.body,
    color: colors.text.primary,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  specialtyChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  specialtyIcon: {
    fontSize: 16,
  },
  specialtyLabel: {
    ...typography.caption,
    color: colors.text.primary,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
});
