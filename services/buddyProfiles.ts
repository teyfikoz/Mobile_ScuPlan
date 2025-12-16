import { supabase, getDeviceId, setDeviceIdContext, hashDeviceId } from '../lib/supabase';
import { BuddyProfile, CertificationLevel } from '../packages/core/types';
import { validateBuddyProfile } from '../packages/core/validators';
import { roundToGrid } from '../packages/core/calculators';
import { BUDDY_CONFIG } from '../packages/core/constants';

export async function createBuddyProfile(
  profileData: {
    displayName: string;
    certification: CertificationLevel;
    experienceDives: number;
    languages: string[];
    latitude: number;
    longitude: number;
    availableHours: number;
  }
): Promise<BuddyProfile> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  const sessionToken = crypto.randomUUID();
  const availableUntil = Date.now() + profileData.availableHours * 60 * 60 * 1000;

  // Round coordinates for privacy (grid-based discovery)
  const gridLat = roundToGrid(profileData.latitude, BUDDY_CONFIG.GRID_SIZE_DEGREES);
  const gridLon = roundToGrid(profileData.longitude, BUDDY_CONFIG.GRID_SIZE_DEGREES);

  const profile: BuddyProfile = {
    id: crypto.randomUUID(),
    deviceId: hashedDeviceId,
    sessionToken,
    displayName: profileData.displayName,
    certification: profileData.certification,
    experienceDives: profileData.experienceDives,
    languages: profileData.languages,
    location: {
      gridLat,
      gridLon,
    },
    availableUntil,
    createdAt: Date.now(),
  };

  validateBuddyProfile(profile);

  const { data, error } = await supabase
    .from('buddy_profiles')
    .insert({
      id: profile.id,
      device_id: hashedDeviceId,
      session_token: sessionToken,
      display_name: profile.displayName,
      certification: profile.certification,
      experience_dives: profile.experienceDives,
      languages: profile.languages,
      grid_lat: gridLat,
      grid_lon: gridLon,
      available_until: new Date(availableUntil).toISOString(),
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

export async function searchBuddies(
  latitude: number,
  longitude: number,
  radiusMeters: number = BUDDY_CONFIG.DEFAULT_RADIUS_METERS
): Promise<BuddyProfile[]> {
  await setDeviceIdContext();

  // Calculate lat/lon delta for approximate radius
  const latDelta = radiusMeters / 111320; // 1 degree latitude ≈ 111.32 km
  const lonDelta = radiusMeters / (111320 * Math.cos((latitude * Math.PI) / 180));

  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;

  const { data, error } = await supabase
    .from('buddy_profiles')
    .select('*')
    .gte('grid_lat', minLat)
    .lte('grid_lat', maxLat)
    .gte('grid_lon', minLon)
    .lte('grid_lon', maxLon)
    .gt('available_until', new Date().toISOString());

  if (error) {
    throw new Error(`Failed to search buddies: ${error.message}`);
  }

  return (data || []).map(mapDbToProfile);
}

export async function updateBuddyProfile(
  updates: {
    displayName?: string;
    certification?: CertificationLevel;
    experienceDives?: number;
    languages?: string[];
    latitude?: number;
    longitude?: number;
    availableHours?: number;
  }
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
  if (updates.certification) updateData.certification = updates.certification;
  if (updates.experienceDives !== undefined) {
    updateData.experience_dives = updates.experienceDives;
  }
  if (updates.languages) updateData.languages = updates.languages;

  if (updates.latitude !== undefined && updates.longitude !== undefined) {
    updateData.grid_lat = roundToGrid(updates.latitude, BUDDY_CONFIG.GRID_SIZE_DEGREES);
    updateData.grid_lon = roundToGrid(updates.longitude, BUDDY_CONFIG.GRID_SIZE_DEGREES);
  }

  if (updates.availableHours !== undefined) {
    const availableUntil = Date.now() + updates.availableHours * 60 * 60 * 1000;
    updateData.available_until = new Date(availableUntil).toISOString();
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
    certification: data.certification as CertificationLevel,
    experienceDives: data.experience_dives,
    languages: data.languages,
    location: {
      gridLat: parseFloat(data.grid_lat),
      gridLon: parseFloat(data.grid_lon),
    },
    availableUntil: new Date(data.available_until).getTime(),
    createdAt: new Date(data.created_at).getTime(),
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
