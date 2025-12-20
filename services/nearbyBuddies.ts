import { supabase } from '../lib/supabase';
import { UserProfile, CertificationLevel, CertificationOrganization, DivingSpecialty } from '../packages/core/types';

export interface NearbyBuddyFilters {
  maxDistanceKm?: number;
  certificationOrg?: CertificationOrganization;
  certificationLevel?: CertificationLevel;
  specialties?: DivingSpecialty[];
  minExperienceDives?: number;
  instructorsOnly?: boolean;
}

export interface NearbyBuddy extends UserProfile {
  distanceKm?: number;
  lastSeen?: number;
  latitude?: number;
  longitude?: number;
}

// Update user's current location for nearby discovery
export async function updateUserLocation(
  userId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  // Store location in a temporary table for real-time discovery
  const { error } = await supabase
    .from('user_locations')
    .upsert({
      user_id: userId,
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Failed to update location:', error);
    throw new Error(`Failed to update location: ${error.message}`);
  }
}

// Find nearby buddies based on current location
export async function findNearbyBuddies(
  currentUserId: string,
  latitude: number,
  longitude: number,
  filters: NearbyBuddyFilters = {}
): Promise<NearbyBuddy[]> {
  const maxDistanceKm = filters.maxDistanceKm || 50;

  // Calculate approximate bounding box (1 degree ≈ 111km)
  const latDelta = maxDistanceKm / 111;
  const lonDelta = maxDistanceKm / (111 * Math.cos((latitude * Math.PI) / 180));

  // Build query for user profiles with location sharing enabled
  let query = supabase
    .from('user_profiles')
    .select(`
      *,
      user_locations!inner(latitude, longitude, updated_at)
    `)
    .eq('location_sharing_enabled', true)
    .eq('profile_visible', true)
    .neq('id', currentUserId);

  // Location bounds
  query = query
    .gte('user_locations.latitude', latitude - latDelta)
    .lte('user_locations.latitude', latitude + latDelta)
    .gte('user_locations.longitude', longitude - lonDelta)
    .lte('user_locations.longitude', longitude + lonDelta);

  // Apply filters
  if (filters.certificationOrg) {
    query = query.eq('certification_org', filters.certificationOrg);
  }

  if (filters.certificationLevel) {
    query = query.eq('certification_level', filters.certificationLevel);
  }

  if (filters.minExperienceDives !== undefined) {
    query = query.gte('experience_dives', filters.minExperienceDives);
  }

  // Filter for instructors only
  if (filters.instructorsOnly) {
    query = query.in('certification_level', ['INSTRUCTOR', 'MASTER_INSTRUCTOR']);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to find nearby buddies: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Calculate actual distances and filter by max distance
  const buddiesWithDistance: NearbyBuddy[] = [];

  for (const row of data) {
    const userLoc = row.user_locations;
    if (!userLoc || !userLoc.latitude || !userLoc.longitude) continue;

    const distance = calculateDistance(
      latitude,
      longitude,
      userLoc.latitude,
      userLoc.longitude
    );

    if (distance <= maxDistanceKm) {
      // Filter by specialties if specified
      if (filters.specialties && filters.specialties.length > 0) {
        const userSpecialties = row.specialties || [];
        const hasMatchingSpecialty = filters.specialties.some(s =>
          userSpecialties.includes(s)
        );
        if (!hasMatchingSpecialty) continue;
      }

      const buddy: NearbyBuddy = {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        phone: row.phone,
        certificationOrg: row.certification_org,
        certificationLevel: row.certification_level,
        experienceDives: row.experience_dives || 0,
        specialties: row.specialties || [],
        country: row.country,
        city: row.city,
        region: row.region,
        profileVisible: row.profile_visible ?? true,
        locationSharingEnabled: row.location_sharing_enabled ?? false,
        showRealName: row.show_real_name ?? false,
        gdprConsentGiven: row.gdpr_consent_given ?? false,
        gdprConsentDate: row.gdpr_consent_date ? new Date(row.gdpr_consent_date).getTime() : undefined,
        kvkkConsentGiven: row.kvkk_consent_given ?? false,
        kvkkConsentDate: row.kvkk_consent_date ? new Date(row.kvkk_consent_date).getTime() : undefined,
        termsAccepted: row.terms_accepted ?? false,
        termsAcceptedDate: row.terms_accepted_date ? new Date(row.terms_accepted_date).getTime() : undefined,
        marketingConsent: row.marketing_consent ?? false,
        totalDives: row.total_dives || 0,
        totalDiveTimeMinutes: row.total_dive_time_minutes || 0,
        maxDepthMeters: parseFloat(row.max_depth_meters) || 0,
        lastDiveDate: row.last_dive_date ? new Date(row.last_dive_date).getTime() : undefined,
        emergencyContactName: row.emergency_contact_name,
        emergencyContactPhone: row.emergency_contact_phone,
        emergencyContactRelation: row.emergency_contact_relation,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at).getTime() : undefined,
        distanceKm: Math.round(distance * 10) / 10,
        lastSeen: new Date(userLoc.updated_at).getTime(),
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
      };

      buddiesWithDistance.push(buddy);
    }
  }

  // Sort by distance
  buddiesWithDistance.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  return buddiesWithDistance;
}

// Subscribe to nearby buddy updates (real-time)
export function subscribeToNearbyBuddies(
  userId: string,
  latitude: number,
  longitude: number,
  filters: NearbyBuddyFilters,
  onUpdate: (buddies: NearbyBuddy[]) => void
): () => void {
  // Set up real-time subscription to user_locations table
  const channel = supabase
    .channel('nearby-buddies')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_locations',
      },
      async () => {
        // Refresh nearby buddies list when any location updates
        try {
          const buddies = await findNearbyBuddies(userId, latitude, longitude, filters);
          onUpdate(buddies);
        } catch (error) {
          console.error('Error refreshing nearby buddies:', error);
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

// Stop sharing location
export async function stopSharingLocation(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_locations')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to stop sharing location:', error);
  }

  // Update profile setting
  await supabase
    .from('user_profiles')
    .update({ location_sharing_enabled: false })
    .eq('id', userId);
}

// Enable location sharing
export async function enableLocationSharing(userId: string): Promise<void> {
  await supabase
    .from('user_profiles')
    .update({ location_sharing_enabled: true })
    .eq('id', userId);
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Simplified wrapper for getting nearby buddies (for UI components)
export async function getNearbyBuddies(): Promise<NearbyBuddy[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data: locationData } = await supabase
      .from('user_locations')
      .select('latitude, longitude')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!locationData || !locationData.latitude || !locationData.longitude) {
      return [];
    }

    return await findNearbyBuddies(
      user.id,
      locationData.latitude,
      locationData.longitude,
      { maxDistanceKm: 50 }
    );
  } catch (error) {
    console.error('Failed to get nearby buddies:', error);
    return [];
  }
}

// Get statistics about nearby divers
export interface NearbyStatistics {
  totalNearby: number;
  instructors: number;
  averageExperience: number;
  certificationBreakdown: Record<string, number>;
  specialtyBreakdown: Record<string, number>;
}

export async function getNearbyStatistics(
  userId: string,
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 50
): Promise<NearbyStatistics> {
  const buddies = await findNearbyBuddies(userId, latitude, longitude, { maxDistanceKm });

  const stats: NearbyStatistics = {
    totalNearby: buddies.length,
    instructors: 0,
    averageExperience: 0,
    certificationBreakdown: {},
    specialtyBreakdown: {},
  };

  if (buddies.length === 0) {
    return stats;
  }

  let totalExp = 0;

  for (const buddy of buddies) {
    // Count instructors
    if (buddy.certificationLevel === 'INSTRUCTOR' || buddy.certificationLevel === 'MASTER_INSTRUCTOR') {
      stats.instructors++;
    }

    // Sum experience
    totalExp += buddy.experienceDives;

    // Count certifications
    if (buddy.certificationLevel) {
      stats.certificationBreakdown[buddy.certificationLevel] =
        (stats.certificationBreakdown[buddy.certificationLevel] || 0) + 1;
    }

    // Count specialties
    for (const specialty of buddy.specialties) {
      stats.specialtyBreakdown[specialty] =
        (stats.specialtyBreakdown[specialty] || 0) + 1;
    }
  }

  stats.averageExperience = Math.round(totalExp / buddies.length);

  return stats;
}
