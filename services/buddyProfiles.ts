import { supabase, getDeviceId, setDeviceIdContext, hashDeviceId } from '../lib/supabase';
import {
  BuddyProfile,
  CertificationLevel,
  CertificationOrganization,
  DivingSpecialty,
  UserRole,
} from '../packages/core/types';
import { validateBuddyProfile } from '../packages/core/validators';
import { roundToGrid } from '../packages/core/calculators';
import { BUDDY_CONFIG } from '../packages/core/constants';

export interface CreateBuddyProfileData {
  displayName: string;
  role: UserRole;
  certificationOrg: CertificationOrganization;
  certificationLevel: CertificationLevel;
  experienceDives: number;
  specialties: DivingSpecialty[];
  languages: string[];
  country: string;
  city: string;
  region?: string;
  latitude: number;
  longitude: number;
  availableHours: number;
  bio?: string;
}

export interface SearchFilters {
  country?: string;
  city?: string;
  region?: string;
  role?: UserRole;
  isInstructor?: boolean;
  certificationOrg?: CertificationOrganization;
  specialties?: DivingSpecialty[];
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export async function createBuddyProfile(
  profileData: CreateBuddyProfileData
): Promise<BuddyProfile> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  const sessionToken = crypto.randomUUID();
  const availableUntil = Date.now() + profileData.availableHours * 60 * 60 * 1000;

  // Round coordinates for privacy (grid-based discovery)
  const gridLat = roundToGrid(profileData.latitude, BUDDY_CONFIG.GRID_SIZE_DEGREES);
  const gridLon = roundToGrid(profileData.longitude, BUDDY_CONFIG.GRID_SIZE_DEGREES);

  const isInstructor = profileData.role === 'INSTRUCTOR' ||
    profileData.certificationLevel === 'INSTRUCTOR' ||
    profileData.certificationLevel === 'MASTER_INSTRUCTOR';

  const profile: BuddyProfile = {
    id: crypto.randomUUID(),
    deviceId: hashedDeviceId,
    sessionToken,
    displayName: profileData.displayName,
    role: profileData.role,
    certificationOrg: profileData.certificationOrg,
    certificationLevel: profileData.certificationLevel,
    experienceDives: profileData.experienceDives,
    specialties: profileData.specialties,
    languages: profileData.languages,
    location: {
      country: profileData.country,
      city: profileData.city,
      region: profileData.region,
      gridLat,
      gridLon,
    },
    availableUntil,
    createdAt: Date.now(),
    bio: profileData.bio,
    isInstructor,
  };

  validateBuddyProfile(profile);

  const { data, error } = await supabase
    .from('buddy_profiles')
    .insert({
      id: profile.id,
      device_id: hashedDeviceId,
      session_token: sessionToken,
      display_name: profile.displayName,
      role: profile.role,
      certification_org: profile.certificationOrg,
      certification_level: profile.certificationLevel,
      experience_dives: profile.experienceDives,
      specialties: profile.specialties,
      languages: profile.languages,
      country: profile.location.country,
      city: profile.location.city,
      region: profile.location.region,
      grid_lat: gridLat,
      grid_lon: gridLon,
      available_until: new Date(availableUntil).toISOString(),
      bio: profile.bio,
      is_instructor: isInstructor,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create buddy profile: ${error.message}`);
  }

  return mapDbToProfile(data);
}

export async function getMyBuddyProfile(): Promise<BuddyProfile | null> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('buddy_profiles')
    .select('*')
    .eq('device_id', hashedDeviceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch buddy profile: ${error.message}`);
  }

  return data ? mapDbToProfile(data) : null;
}

export async function searchBuddies(filters: SearchFilters): Promise<BuddyProfile[]> {
  await setDeviceIdContext();

  let query = supabase
    .from('buddy_profiles')
    .select('*')
    .gt('available_until', new Date().toISOString());

  // Location-based filtering
  if (filters.country) {
    query = query.eq('country', filters.country);
  }

  if (filters.city) {
    query = query.eq('city', filters.city);
  }

  if (filters.region) {
    query = query.eq('region', filters.region);
  }

  // Role-based filtering
  if (filters.role) {
    query = query.eq('role', filters.role);
  }

  if (filters.isInstructor !== undefined) {
    query = query.eq('is_instructor', filters.isInstructor);
  }

  // Certification filtering
  if (filters.certificationOrg) {
    query = query.eq('certification_org', filters.certificationOrg);
  }

  // Geo-proximity filtering (if coordinates provided)
  if (
    filters.latitude !== undefined &&
    filters.longitude !== undefined &&
    filters.radiusMeters
  ) {
    const latDelta = filters.radiusMeters / 111320;
    const lonDelta =
      filters.radiusMeters / (111320 * Math.cos((filters.latitude * Math.PI) / 180));

    query = query
      .gte('grid_lat', filters.latitude - latDelta)
      .lte('grid_lat', filters.latitude + latDelta)
      .gte('grid_lon', filters.longitude - lonDelta)
      .lte('grid_lon', filters.longitude + lonDelta);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search buddies: ${error.message}`);
  }

  let results = (data || []).map(mapDbToProfile);

  // Client-side specialty filtering (uses JSONB contains)
  if (filters.specialties && filters.specialties.length > 0) {
    results = results.filter((profile) =>
      filters.specialties!.some((specialty) =>
        profile.specialties.includes(specialty)
      )
    );
  }

  return results;
}

// Convenience function for instructor search
export async function searchInstructors(filters: Omit<SearchFilters, 'role' | 'isInstructor'>): Promise<BuddyProfile[]> {
  return searchBuddies({
    ...filters,
    isInstructor: true,
  });
}

export async function updateBuddyProfile(
  updates: Partial<CreateBuddyProfileData>
): Promise<BuddyProfile> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  const existing = await getMyBuddyProfile();
  if (!existing) {
    throw new Error('Buddy profile not found');
  }

  const updateData: any = {};

  if (updates.displayName) updateData.display_name = updates.displayName;
  if (updates.role) updateData.role = updates.role;
  if (updates.certificationOrg) updateData.certification_org = updates.certificationOrg;
  if (updates.certificationLevel) updateData.certification_level = updates.certificationLevel;
  if (updates.experienceDives !== undefined) {
    updateData.experience_dives = updates.experienceDives;
  }
  if (updates.specialties) updateData.specialties = updates.specialties;
  if (updates.languages) updateData.languages = updates.languages;
  if (updates.country) updateData.country = updates.country;
  if (updates.city) updateData.city = updates.city;
  if (updates.region !== undefined) updateData.region = updates.region;
  if (updates.bio !== undefined) updateData.bio = updates.bio;

  if (updates.latitude !== undefined && updates.longitude !== undefined) {
    updateData.grid_lat = roundToGrid(updates.latitude, BUDDY_CONFIG.GRID_SIZE_DEGREES);
    updateData.grid_lon = roundToGrid(updates.longitude, BUDDY_CONFIG.GRID_SIZE_DEGREES);
  }

  if (updates.availableHours !== undefined) {
    const availableUntil = Date.now() + updates.availableHours * 60 * 60 * 1000;
    updateData.available_until = new Date(availableUntil).toISOString();
  }

  // Update is_instructor flag if role or certification changed
  if (updates.role || updates.certificationLevel) {
    const newRole = updates.role || existing.role;
    const newCertLevel = updates.certificationLevel || existing.certificationLevel;
    updateData.is_instructor =
      newRole === 'INSTRUCTOR' ||
      newCertLevel === 'INSTRUCTOR' ||
      newCertLevel === 'MASTER_INSTRUCTOR';
  }

  const { data, error } = await supabase
    .from('buddy_profiles')
    .update(updateData)
    .eq('device_id', hashedDeviceId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update buddy profile: ${error.message}`);
  }

  return mapDbToProfile(data);
}

export async function deleteBuddyProfile(): Promise<void> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  const { error } = await supabase
    .from('buddy_profiles')
    .delete()
    .eq('device_id', hashedDeviceId);

  if (error) {
    throw new Error(`Failed to delete buddy profile: ${error.message}`);
  }
}

function mapDbToProfile(data: any): BuddyProfile {
  return {
    id: data.id,
    deviceId: data.device_id,
    sessionToken: data.session_token,
    displayName: data.display_name,
    role: data.role as UserRole,
    certificationOrg: data.certification_org as CertificationOrganization,
    certificationLevel: data.certification_level as CertificationLevel,
    experienceDives: data.experience_dives,
    specialties: data.specialties || [],
    languages: data.languages || [],
    location: {
      country: data.country,
      city: data.city,
      region: data.region,
      gridLat: parseFloat(data.grid_lat),
      gridLon: parseFloat(data.grid_lon),
    },
    availableUntil: new Date(data.available_until).getTime(),
    createdAt: new Date(data.created_at).getTime(),
    bio: data.bio,
    isInstructor: data.is_instructor || false,
  };
}

// Cleanup expired profiles (should be called periodically via cron)
export async function cleanupExpiredProfiles(): Promise<number> {
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('buddy_profiles')
    .delete()
    .lt('available_until', new Date().toISOString())
    .select();

  if (error) {
    throw new Error(`Failed to cleanup expired profiles: ${error.message}`);
  }

  return data?.length || 0;
}
