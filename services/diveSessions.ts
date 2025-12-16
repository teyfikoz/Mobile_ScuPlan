import { supabase, getDeviceId, setDeviceIdContext } from '../lib/supabase';
import { DiveSession, GeoPoint } from '../packages/core/types';
import { validateDiveSession } from '../packages/core/validators';
import { calculateDistance } from '../packages/core/calculators';

export async function createDiveSession(
  planId?: string
): Promise<DiveSession> {
  const deviceId = await getDeviceId();
  await setDeviceIdContext();

  const session: DiveSession = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    planId,
    status: 'active',
    pointsCount: 0,
    startedAt: Date.now(),
  };

  validateDiveSession(session);

  const { data, error } = await supabase
    .from('dive_sessions')
    .insert({
      id: session.id,
      device_id: deviceId,
      schema_version: session.schemaVersion,
      plan_id: planId,
      status: session.status,
      points_count: 0,
      started_at: new Date(session.startedAt).toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create dive session: ${error.message}`);
  }

  return mapDbToSession(data);
}

export async function getDiveSession(id: string): Promise<DiveSession | null> {
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('dive_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch dive session: ${error.message}`);
  }

  return data ? mapDbToSession(data) : null;
}

export async function getAllDiveSessions(): Promise<DiveSession[]> {
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('dive_sessions')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch dive sessions: ${error.message}`);
  }

  return (data || []).map(mapDbToSession);
}

export async function updateDiveSession(
  id: string,
  updates: Partial<DiveSession>
): Promise<DiveSession> {
  await setDeviceIdContext();

  const updateData: any = {};

  if (updates.status) updateData.status = updates.status;
  if (updates.entry) {
    updateData.entry_lat = updates.entry.lat;
    updateData.entry_lon = updates.entry.lon;
    updateData.entry_ts = new Date(updates.entry.ts).toISOString();
    updateData.entry_accuracy_m = updates.entry.accuracyM;
  }
  if (updates.exit) {
    updateData.exit_lat = updates.exit.lat;
    updateData.exit_lon = updates.exit.lon;
    updateData.exit_ts = new Date(updates.exit.ts).toISOString();
    updateData.exit_accuracy_m = updates.exit.accuracyM;
  }
  if (updates.pointsCount !== undefined) {
    updateData.points_count = updates.pointsCount;
  }
  if (updates.endedAt) {
    updateData.ended_at = new Date(updates.endedAt).toISOString();
  }
  if (updates.stats) {
    updateData.duration_sec = updates.stats.durationSec;
    updateData.max_distance_from_entry_m = updates.stats.maxDistanceFromEntryM;
    updateData.total_track_distance_m = updates.stats.totalTrackDistanceM;
  }
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes;
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('dive_sessions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update dive session: ${error.message}`);
  }

  return mapDbToSession(data);
}

export async function addTrackPoint(
  sessionId: string,
  point: GeoPoint
): Promise<void> {
  await setDeviceIdContext();

  const session = await getDiveSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const sequence = session.pointsCount;

  const { error } = await supabase.from('track_points').insert({
    session_id: sessionId,
    lat: point.lat,
    lon: point.lon,
    ts: new Date(point.ts).toISOString(),
    accuracy_m: point.accuracyM,
    sequence,
  });

  if (error) {
    throw new Error(`Failed to add track point: ${error.message}`);
  }

  await updateDiveSession(sessionId, {
    pointsCount: sequence + 1,
  });
}

export async function getTrackPoints(sessionId: string): Promise<GeoPoint[]> {
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('track_points')
    .select('*')
    .eq('session_id', sessionId)
    .order('sequence', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch track points: ${error.message}`);
  }

  return (data || []).map((point) => ({
    lat: point.lat,
    lon: point.lon,
    ts: new Date(point.ts).getTime(),
    accuracyM: point.accuracy_m,
  }));
}

export async function completeDiveSession(
  sessionId: string,
  notes?: string
): Promise<DiveSession> {
  const session = await getDiveSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const points = await getTrackPoints(sessionId);
  const endedAt = Date.now();
  const durationSec = Math.floor((endedAt - session.startedAt) / 1000);

  let maxDistanceFromEntryM = 0;
  let totalTrackDistanceM = 0;

  if (session.entry && points.length > 0) {
    for (let i = 0; i < points.length; i++) {
      const distanceFromEntry = calculateDistance(session.entry, points[i]);
      maxDistanceFromEntryM = Math.max(
        maxDistanceFromEntryM,
        distanceFromEntry
      );

      if (i > 0) {
        totalTrackDistanceM += calculateDistance(points[i - 1], points[i]);
      }
    }
  }

  return await updateDiveSession(sessionId, {
    status: 'completed',
    endedAt,
    notes,
    stats: {
      durationSec,
      maxDistanceFromEntryM,
      totalTrackDistanceM,
    },
  });
}

function mapDbToSession(data: any): DiveSession {
  const session: DiveSession = {
    id: data.id,
    schemaVersion: data.schema_version,
    planId: data.plan_id,
    status: data.status,
    pointsCount: data.points_count,
    startedAt: new Date(data.started_at).getTime(),
    endedAt: data.ended_at ? new Date(data.ended_at).getTime() : undefined,
    notes: data.notes,
  };

  if (data.entry_lat && data.entry_lon && data.entry_ts) {
    session.entry = {
      lat: data.entry_lat,
      lon: data.entry_lon,
      ts: new Date(data.entry_ts).getTime(),
      accuracyM: data.entry_accuracy_m,
    };
  }

  if (data.exit_lat && data.exit_lon && data.exit_ts) {
    session.exit = {
      lat: data.exit_lat,
      lon: data.exit_lon,
      ts: new Date(data.exit_ts).getTime(),
      accuracyM: data.exit_accuracy_m,
    };
  }

  if (data.duration_sec) {
    session.stats = {
      durationSec: data.duration_sec,
      maxDistanceFromEntryM: parseFloat(
        data.max_distance_from_entry_m || '0'
      ),
      totalTrackDistanceM: parseFloat(data.total_track_distance_m || '0'),
    };
  }

  return session;
}
