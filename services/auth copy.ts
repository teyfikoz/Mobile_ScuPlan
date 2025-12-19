import { supabase } from '../lib/supabase';
import { UserProfile, UserConsent } from '../packages/core/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PROFILE: '@scuplan:user_profile',
  ONBOARDING_COMPLETE: '@scuplan:onboarding_complete',
};

export interface SignInResult {
  user: UserProfile | null;
  session: any;
  isNewUser: boolean;
}

// Sign in with Email (Development/Testing)
export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  // Try to sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  let session = signInData?.session;

  // If sign in fails, try to sign up
  if (signInError) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      throw new Error(`Authentication failed: ${signUpError.message}`);
    }

    session = signUpData.session;
  }

  if (!session) {
    throw new Error('No session established after authentication');
  }

  // Check if user profile exists
  const profile = await getUserProfile(session.user.id);
  const isNewUser = !profile;

  // Create basic profile if new user
  if (isNewUser) {
    const newProfile = await createUserProfile({
      id: session.user.id,
      email: session.user.email!,
      fullName: email.split('@')[0], // Use email prefix as default name
    });
    return { user: newProfile, session, isNewUser: true };
  }

  return { user: profile, session, isNewUser: false };
}

// Sign in with Google
export async function signInWithGoogle(): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'scuplan://auth/callback',
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    throw new Error(`Google sign in failed: ${error.message}`);
  }

  // Wait for session to be established
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No session established after Google sign in');
  }

  // Check if user profile exists
  const profile = await getUserProfile(session.user.id);
  const isNewUser = !profile;

  // Create basic profile if new user
  if (isNewUser) {
    const newProfile = await createUserProfile({
      id: session.user.id,
      email: session.user.email!,
      fullName: session.user.user_metadata?.full_name,
      avatarUrl: session.user.user_metadata?.avatar_url,
    });
    return { user: newProfile, session, isNewUser: true };
  }

  return { user: profile, session, isNewUser: false };
}

// Sign in with Apple
export async function signInWithApple(): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: 'scuplan://auth/callback',
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    throw new Error(`Apple sign in failed: ${error.message}`);
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No session established after Apple sign in');
  }

  const profile = await getUserProfile(session.user.id);
  const isNewUser = !profile;

  if (isNewUser) {
    const newProfile = await createUserProfile({
      id: session.user.id,
      email: session.user.email!,
      fullName: session.user.user_metadata?.full_name,
      avatarUrl: session.user.user_metadata?.avatar_url,
    });
    return { user: newProfile, session, isNewUser: true };
  }

  return { user: profile, session, isNewUser: false };
}

// Sign out
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }

  // Clear local storage
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.USER_PROFILE,
    STORAGE_KEYS.ONBOARDING_COMPLETE,
  ]);
}

// Get current user profile
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return await getUserProfile(user.id);
}

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapDbToUserProfile(data);
}

// Create user profile
export async function createUserProfile(profileData: {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  const profile = {
    id: profileData.id,
    email: profileData.email,
    full_name: profileData.fullName,
    avatar_url: profileData.avatarUrl,
    experience_dives: 0,
    specialties: [],
    profile_visible: true,
    location_sharing_enabled: false,
    show_real_name: false,
    gdpr_consent_given: false,
    kvkk_consent_given: false,
    terms_accepted: false,
    marketing_consent: false,
    total_dives: 0,
    total_dive_time_minutes: 0,
    max_depth_meters: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  return mapDbToUserProfile(data);
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const updateData: any = {};

  if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
  if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
  if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.certificationOrg !== undefined) updateData.certification_org = updates.certificationOrg;
  if (updates.certificationLevel !== undefined) updateData.certification_level = updates.certificationLevel;
  if (updates.experienceDives !== undefined) updateData.experience_dives = updates.experienceDives;
  if (updates.specialties !== undefined) updateData.specialties = updates.specialties;
  if (updates.country !== undefined) updateData.country = updates.country;
  if (updates.city !== undefined) updateData.city = updates.city;
  if (updates.region !== undefined) updateData.region = updates.region;
  if (updates.profileVisible !== undefined) updateData.profile_visible = updates.profileVisible;
  if (updates.locationSharingEnabled !== undefined) updateData.location_sharing_enabled = updates.locationSharingEnabled;
  if (updates.showRealName !== undefined) updateData.show_real_name = updates.showRealName;
  if (updates.emergencyContactName !== undefined) updateData.emergency_contact_name = updates.emergencyContactName;
  if (updates.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = updates.emergencyContactPhone;
  if (updates.emergencyContactRelation !== undefined) updateData.emergency_contact_relation = updates.emergencyContactRelation;

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return mapDbToUserProfile(data);
}

// Record user consent
export async function recordConsent(
  userId: string,
  consentData: {
    type: 'GDPR' | 'KVKK' | 'TERMS' | 'MARKETING';
    version: string;
    text: string;
    granted: boolean;
  }
): Promise<UserConsent> {
  const consent = {
    user_id: userId,
    consent_type: consentData.type,
    consent_version: consentData.version,
    consent_text: consentData.text,
    granted: consentData.granted,
    granted_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_consents')
    .insert(consent)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record consent: ${error.message}`);
  }

  // Update user profile consent flags
  const profileUpdates: any = {};

  if (consentData.type === 'GDPR') {
    profileUpdates.gdpr_consent_given = consentData.granted;
    profileUpdates.gdpr_consent_date = new Date().toISOString();
  } else if (consentData.type === 'KVKK') {
    profileUpdates.kvkk_consent_given = consentData.granted;
    profileUpdates.kvkk_consent_date = new Date().toISOString();
  } else if (consentData.type === 'TERMS') {
    profileUpdates.terms_accepted = consentData.granted;
    profileUpdates.terms_accepted_date = new Date().toISOString();
  } else if (consentData.type === 'MARKETING') {
    profileUpdates.marketing_consent = consentData.granted;
  }

  await supabase
    .from('user_profiles')
    .update(profileUpdates)
    .eq('id', userId);

  return mapDbToConsent(data);
}

// Get user consents
export async function getUserConsents(userId: string): Promise<UserConsent[]> {
  const { data, error } = await supabase
    .from('user_consents')
    .select('*')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch consents: ${error.message}`);
  }

  return (data || []).map(mapDbToConsent);
}

// Check if onboarding is complete
export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  return value === 'true';
}

// Mark onboarding as complete
export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
}

// Helper function to map database row to UserProfile
function mapDbToUserProfile(data: any): UserProfile {
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    phone: data.phone,
    certificationOrg: data.certification_org,
    certificationLevel: data.certification_level,
    experienceDives: data.experience_dives || 0,
    specialties: data.specialties || [],
    country: data.country,
    city: data.city,
    region: data.region,
    profileVisible: data.profile_visible ?? true,
    locationSharingEnabled: data.location_sharing_enabled ?? false,
    showRealName: data.show_real_name ?? false,
    gdprConsentGiven: data.gdpr_consent_given ?? false,
    gdprConsentDate: data.gdpr_consent_date ? new Date(data.gdpr_consent_date).getTime() : undefined,
    kvkkConsentGiven: data.kvkk_consent_given ?? false,
    kvkkConsentDate: data.kvkk_consent_date ? new Date(data.kvkk_consent_date).getTime() : undefined,
    termsAccepted: data.terms_accepted ?? false,
    termsAcceptedDate: data.terms_accepted_date ? new Date(data.terms_accepted_date).getTime() : undefined,
    marketingConsent: data.marketing_consent ?? false,
    totalDives: data.total_dives || 0,
    totalDiveTimeMinutes: data.total_dive_time_minutes || 0,
    maxDepthMeters: parseFloat(data.max_depth_meters) || 0,
    lastDiveDate: data.last_dive_date ? new Date(data.last_dive_date).getTime() : undefined,
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
    emergencyContactRelation: data.emergency_contact_relation,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at).getTime() : undefined,
  };
}

// Helper function to map database row to UserConsent
function mapDbToConsent(data: any): UserConsent {
  return {
    id: data.id,
    userId: data.user_id,
    consentType: data.consent_type,
    consentVersion: data.consent_version,
    consentText: data.consent_text,
    granted: data.granted,
    grantedAt: new Date(data.granted_at).getTime(),
    ipAddress: data.ip_address,
    userAgent: data.user_agent,
  };
}
