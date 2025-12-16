import { supabase, getDeviceId, setDeviceIdContext, hashDeviceId } from '../lib/supabase';
import { ContactRequest } from '../packages/core/types';
import { BUDDY_CONFIG } from '../packages/core/constants';

export async function sendContactRequest(
  toBuddyProfileId: string,
  message?: string
): Promise<ContactRequest> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  // Get the target profile to get their device_id
  const { data: targetProfile, error: profileError } = await supabase
    .from('buddy_profiles')
    .select('device_id')
    .eq('id', toBuddyProfileId)
    .single();

  if (profileError || !targetProfile) {
    throw new Error('Target buddy profile not found');
  }

  const expiresAt = Date.now() + BUDDY_CONFIG.SESSION_TTL_HOURS * 60 * 60 * 1000;

  const request: ContactRequest = {
    id: crypto.randomUUID(),
    fromDeviceId: hashedDeviceId,
    toDeviceId: targetProfile.device_id,
    status: 'pending',
    message,
    createdAt: Date.now(),
    expiresAt,
  };

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({
      id: request.id,
      from_device_id: hashedDeviceId,
      to_device_id: targetProfile.device_id,
      status: request.status,
      message: request.message,
      expires_at: new Date(expiresAt).toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to send contact request: ${error.message}`);
  }

  return mapDbToRequest(data);
}

export async function getReceivedContactRequests(): Promise<ContactRequest[]> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .eq('to_device_id', hashedDeviceId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch contact requests: ${error.message}`);
  }

  return (data || []).map(mapDbToRequest);
}

export async function getSentContactRequests(): Promise<ContactRequest[]> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .eq('from_device_id', hashedDeviceId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch sent requests: ${error.message}`);
  }

  return (data || []).map(mapDbToRequest);
}

export async function respondToContactRequest(
  requestId: string,
  accept: boolean
): Promise<ContactRequest> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('contact_requests')
    .update({
      status: accept ? 'accepted' : 'declined',
    })
    .eq('id', requestId)
    .eq('to_device_id', hashedDeviceId) // Ensure only recipient can respond
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to respond to contact request: ${error.message}`);
  }

  return mapDbToRequest(data);
}

export async function deleteContactRequest(requestId: string): Promise<void> {
  const deviceId = await getDeviceId();
  const hashedDeviceId = await hashDeviceId(deviceId);
  await setDeviceIdContext();

  const { error } = await supabase
    .from('contact_requests')
    .delete()
    .eq('id', requestId)
    .or(`from_device_id.eq.${hashedDeviceId},to_device_id.eq.${hashedDeviceId}`);

  if (error) {
    throw new Error(`Failed to delete contact request: ${error.message}`);
  }
}

function mapDbToRequest(data: any): ContactRequest {
  return {
    id: data.id,
    fromDeviceId: data.from_device_id,
    toDeviceId: data.to_device_id,
    status: data.status,
    message: data.message,
    createdAt: new Date(data.created_at).getTime(),
    expiresAt: new Date(data.expires_at).getTime(),
  };
}

// Cleanup expired requests (should be called periodically via cron)
export async function cleanupExpiredRequests(): Promise<number> {
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('contact_requests')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select();

  if (error) {
    throw new Error(`Failed to cleanup expired requests: ${error.message}`);
  }

  return data?.length || 0;
}
