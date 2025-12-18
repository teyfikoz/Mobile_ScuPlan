import { supabase } from '../lib/supabase';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { getCurrentUserProfile } from './auth';
import { sendEmergencyAlertNotification } from './notifications';

export interface SOSAlert {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  message: string;
  status: 'active' | 'resolved' | 'cancelled';
  triggeredAt: number;
  resolvedAt?: number;
  buddyIds: string[];
  emergencyContactNotified: boolean;
}

// Trigger SOS alert
export async function triggerSOS(): Promise<{ success: boolean; alertId?: string; error?: string }> {
  try {
    // Get current user profile
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get current location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'Location permission denied' };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude, accuracy } = location.coords;

    // Create SOS alert in database
    const { data: alert, error: dbError } = await supabase
      .from('sos_alerts')
      .insert({
        user_id: profile.id,
        latitude,
        longitude,
        accuracy,
        message: `EMERGENCY: ${profile.displayName || profile.fullName} has triggered an SOS alert!`,
        status: 'active',
        triggered_at: new Date().toISOString(),
        emergency_contact_notified: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create SOS alert:', dbError);
      return { success: false, error: dbError.message };
    }

    // Send SMS to emergency contact if configured
    if (profile.emergencyContactPhone) {
      await sendEmergencySMS(
        profile.emergencyContactPhone,
        profile.displayName || profile.fullName || 'A diver',
        latitude,
        longitude
      );

      // Update emergency contact notified status
      await supabase
        .from('sos_alerts')
        .update({ emergency_contact_notified: true })
        .eq('id', alert.id);
    }

    // Get nearby buddies
    const nearbyBuddies = await getNearbyBuddiesForSOS(profile.id, latitude, longitude);

    // Send push notifications to nearby buddies
    for (const buddy of nearbyBuddies) {
      try {
        await sendEmergencyAlertNotification(
          buddy.userId,
          profile.displayName || profile.fullName || 'A diver',
          `${Math.round(buddy.distance * 10) / 10}km away`
        );
      } catch (error) {
        console.error('Failed to send emergency alert to buddy:', error);
      }
    }

    return { success: true, alertId: alert.id };
  } catch (error) {
    console.error('Failed to trigger SOS:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send emergency SMS
async function sendEmergencySMS(
  phoneNumber: string,
  diverName: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const isAvailable = await SMS.isAvailableAsync();

  if (!isAvailable) {
    console.log('SMS not available on this device');
    return;
  }

  const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
  const message = `🚨 EMERGENCY ALERT 🚨\n\n${diverName} has triggered an SOS alert while diving!\n\nLocation: ${googleMapsUrl}\n\nPlease contact emergency services immediately if needed.\n\nSent by ScuPlan Dive Safety`;

  try {
    await SMS.sendSMSAsync([phoneNumber], message);
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
}

// Get nearby buddies for SOS notification
async function getNearbyBuddiesForSOS(
  userId: string,
  latitude: number,
  longitude: number
): Promise<Array<{ userId: string; distance: number }>> {
  const maxDistanceKm = 10; // 10km radius for SOS

  // Calculate bounding box
  const latDelta = maxDistanceKm / 111;
  const lonDelta = maxDistanceKm / (111 * Math.cos((latitude * Math.PI) / 180));

  const { data, error } = await supabase
    .from('user_locations')
    .select('user_id, latitude, longitude')
    .neq('user_id', userId)
    .gte('latitude', latitude - latDelta)
    .lte('latitude', latitude + latDelta)
    .gte('longitude', longitude - lonDelta)
    .lte('longitude', longitude + lonDelta)
    .gt('updated_at', new Date(Date.now() - 3600000).toISOString()); // Within last hour

  if (error) {
    console.error('Failed to get nearby buddies:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Calculate actual distances
  const buddiesWithDistance = data
    .map((buddy) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        buddy.latitude,
        buddy.longitude
      );

      return {
        userId: buddy.user_id,
        distance,
      };
    })
    .filter((buddy) => buddy.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);

  return buddiesWithDistance;
}

// Calculate distance using Haversine formula
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
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Resolve SOS alert
export async function resolveSOSAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('sos_alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) {
    console.error('Failed to resolve SOS alert:', error);
    throw error;
  }
}

// Cancel SOS alert
export async function cancelSOSAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('sos_alerts')
    .update({
      status: 'cancelled',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) {
    console.error('Failed to cancel SOS alert:', error);
    throw error;
  }
}

// Get active SOS alerts
export async function getActiveSOSAlerts(userId: string): Promise<SOSAlert[]> {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('triggered_at', { ascending: false });

  if (error) {
    console.error('Failed to get SOS alerts:', error);
    throw error;
  }

  return (data || []).map(mapDbToSOSAlert);
}

// Get all SOS alerts history
export async function getSOSAlertsHistory(userId: string): Promise<SOSAlert[]> {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('triggered_at', { ascending: false });

  if (error) {
    console.error('Failed to get SOS history:', error);
    throw error;
  }

  return (data || []).map(mapDbToSOSAlert);
}

// Subscribe to SOS alerts
export function subscribeToSOSAlerts(
  userId: string,
  onAlert: (alert: SOSAlert) => void
): () => void {
  const channel = supabase
    .channel('sos-alerts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sos_alerts',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onAlert(mapDbToSOSAlert(payload.new));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Helper function to map database row to SOSAlert
function mapDbToSOSAlert(data: any): SOSAlert {
  return {
    id: data.id,
    userId: data.user_id,
    latitude: parseFloat(data.latitude),
    longitude: parseFloat(data.longitude),
    accuracy: data.accuracy ? parseFloat(data.accuracy) : undefined,
    message: data.message,
    status: data.status,
    triggeredAt: new Date(data.triggered_at).getTime(),
    resolvedAt: data.resolved_at ? new Date(data.resolved_at).getTime() : undefined,
    buddyIds: data.buddy_ids || [],
    emergencyContactNotified: data.emergency_contact_notified,
  };
}
