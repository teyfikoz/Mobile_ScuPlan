import { supabase } from '../lib/supabase';
import { DiveHistoryEntry } from '../packages/core/types';

export interface CreateDiveHistoryData {
  userId: string;
  sessionId?: string;
  diveNumber: number;
  diveDate: number;
  diveSiteName?: string;
  diveSiteCountry?: string;
  diveSiteCity?: string;
  maxDepthMeters: number;
  durationMinutes: number;
  waterTemperatureCelsius?: number;
  visibilityMeters?: number;
  gasMix?: string;
  tankVolumeLiters?: number;
  startingPressureBar?: number;
  endingPressureBar?: number;
  weatherConditions?: string;
  seaState?: string;
  currentStrength?: string;
  buddyNames?: string[];
  instructorName?: string;
  notes?: string;
  highlights?: string[];
  wildlifeSpotted?: string[];
  photoUrls?: string[];
  difficultyRating?: number;
  enjoymentRating?: number;
}

// Create dive history entry
export async function createDiveHistory(
  data: CreateDiveHistoryData
): Promise<DiveHistoryEntry> {
  const entry = {
    user_id: data.userId,
    session_id: data.sessionId,
    dive_number: data.diveNumber,
    dive_date: new Date(data.diveDate).toISOString(),
    dive_site_name: data.diveSiteName,
    dive_site_country: data.diveSiteCountry,
    dive_site_city: data.diveSiteCity,
    max_depth_meters: data.maxDepthMeters,
    duration_minutes: data.durationMinutes,
    water_temperature_celsius: data.waterTemperatureCelsius,
    visibility_meters: data.visibilityMeters,
    gas_mix: data.gasMix,
    tank_volume_liters: data.tankVolumeLiters,
    starting_pressure_bar: data.startingPressureBar,
    ending_pressure_bar: data.endingPressureBar,
    weather_conditions: data.weatherConditions,
    sea_state: data.seaState,
    current_strength: data.currentStrength,
    buddy_names: data.buddyNames,
    instructor_name: data.instructorName,
    notes: data.notes,
    highlights: data.highlights,
    wildlife_spotted: data.wildlifeSpotted,
    photo_urls: data.photoUrls,
    difficulty_rating: data.difficultyRating,
    enjoyment_rating: data.enjoymentRating,
  };

  const { data: result, error } = await supabase
    .from('dive_history')
    .insert(entry)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create dive history: ${error.message}`);
  }

  return mapDbToDiveHistory(result);
}

// Get user's dive history
export async function getUserDiveHistory(userId: string): Promise<DiveHistoryEntry[]> {
  const { data, error } = await supabase
    .from('dive_history')
    .select('*')
    .eq('user_id', userId)
    .order('dive_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch dive history: ${error.message}`);
  }

  return (data || []).map(mapDbToDiveHistory);
}

// Get single dive history entry
export async function getDiveHistoryEntry(entryId: string): Promise<DiveHistoryEntry | null> {
  const { data, error } = await supabase
    .from('dive_history')
    .select('*')
    .eq('id', entryId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch dive history entry: ${error.message}`);
  }

  return data ? mapDbToDiveHistory(data) : null;
}

// Update dive history entry
export async function updateDiveHistory(
  entryId: string,
  updates: Partial<CreateDiveHistoryData>
): Promise<DiveHistoryEntry> {
  const updateData: any = {};

  if (updates.diveSiteName !== undefined) updateData.dive_site_name = updates.diveSiteName;
  if (updates.diveSiteCountry !== undefined) updateData.dive_site_country = updates.diveSiteCountry;
  if (updates.diveSiteCity !== undefined) updateData.dive_site_city = updates.diveSiteCity;
  if (updates.maxDepthMeters !== undefined) updateData.max_depth_meters = updates.maxDepthMeters;
  if (updates.durationMinutes !== undefined) updateData.duration_minutes = updates.durationMinutes;
  if (updates.waterTemperatureCelsius !== undefined) updateData.water_temperature_celsius = updates.waterTemperatureCelsius;
  if (updates.visibilityMeters !== undefined) updateData.visibility_meters = updates.visibilityMeters;
  if (updates.gasMix !== undefined) updateData.gas_mix = updates.gasMix;
  if (updates.tankVolumeLiters !== undefined) updateData.tank_volume_liters = updates.tankVolumeLiters;
  if (updates.startingPressureBar !== undefined) updateData.starting_pressure_bar = updates.startingPressureBar;
  if (updates.endingPressureBar !== undefined) updateData.ending_pressure_bar = updates.endingPressureBar;
  if (updates.weatherConditions !== undefined) updateData.weather_conditions = updates.weatherConditions;
  if (updates.seaState !== undefined) updateData.sea_state = updates.seaState;
  if (updates.currentStrength !== undefined) updateData.current_strength = updates.currentStrength;
  if (updates.buddyNames !== undefined) updateData.buddy_names = updates.buddyNames;
  if (updates.instructorName !== undefined) updateData.instructor_name = updates.instructorName;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.highlights !== undefined) updateData.highlights = updates.highlights;
  if (updates.wildlifeSpotted !== undefined) updateData.wildlife_spotted = updates.wildlifeSpotted;
  if (updates.photoUrls !== undefined) updateData.photo_urls = updates.photoUrls;
  if (updates.difficultyRating !== undefined) updateData.difficulty_rating = updates.difficultyRating;
  if (updates.enjoymentRating !== undefined) updateData.enjoyment_rating = updates.enjoymentRating;

  const { data, error } = await supabase
    .from('dive_history')
    .update(updateData)
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update dive history: ${error.message}`);
  }

  return mapDbToDiveHistory(data);
}

// Delete dive history entry
export async function deleteDiveHistory(entryId: string): Promise<void> {
  const { error } = await supabase
    .from('dive_history')
    .delete()
    .eq('id', entryId);

  if (error) {
    throw new Error(`Failed to delete dive history: ${error.message}`);
  }
}

// Get dive statistics for user
export async function getDiveStatistics(userId: string): Promise<{
  totalDives: number;
  totalTimeMinutes: number;
  maxDepthMeters: number;
  avgDepthMeters: number;
  avgDurationMinutes: number;
  countriesVisited: number;
  sitesVisited: number;
  lastDiveDate?: number;
}> {
  const history = await getUserDiveHistory(userId);

  if (history.length === 0) {
    return {
      totalDives: 0,
      totalTimeMinutes: 0,
      maxDepthMeters: 0,
      avgDepthMeters: 0,
      avgDurationMinutes: 0,
      countriesVisited: 0,
      sitesVisited: 0,
    };
  }

  const totalDives = history.length;
  const totalTimeMinutes = history.reduce((sum, dive) => sum + dive.durationMinutes, 0);
  const maxDepthMeters = Math.max(...history.map(dive => dive.maxDepthMeters));
  const avgDepthMeters = history.reduce((sum, dive) => sum + dive.maxDepthMeters, 0) / totalDives;
  const avgDurationMinutes = totalTimeMinutes / totalDives;

  const countries = new Set(history.filter(d => d.diveSiteCountry).map(d => d.diveSiteCountry));
  const sites = new Set(history.filter(d => d.diveSiteName).map(d => d.diveSiteName));

  const lastDiveDate = history[0]?.diveDate; // Already sorted by date desc

  return {
    totalDives,
    totalTimeMinutes,
    maxDepthMeters,
    avgDepthMeters: Math.round(avgDepthMeters * 10) / 10,
    avgDurationMinutes: Math.round(avgDurationMinutes),
    countriesVisited: countries.size,
    sitesVisited: sites.size,
    lastDiveDate,
  };
}

// Get next dive number for user
export async function getNextDiveNumber(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('dive_history')
    .select('dive_number')
    .eq('user_id', userId)
    .order('dive_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching last dive number:', error);
    return 1;
  }

  return data ? data.dive_number + 1 : 1;
}

// Helper function to map database row to DiveHistoryEntry
function mapDbToDiveHistory(data: any): DiveHistoryEntry {
  return {
    id: data.id,
    userId: data.user_id,
    sessionId: data.session_id,
    diveNumber: data.dive_number,
    diveDate: new Date(data.dive_date).getTime(),
    diveSiteName: data.dive_site_name,
    diveSiteCountry: data.dive_site_country,
    diveSiteCity: data.dive_site_city,
    maxDepthMeters: parseFloat(data.max_depth_meters),
    durationMinutes: data.duration_minutes,
    waterTemperatureCelsius: data.water_temperature_celsius ? parseFloat(data.water_temperature_celsius) : undefined,
    visibilityMeters: data.visibility_meters ? parseFloat(data.visibility_meters) : undefined,
    gasMix: data.gas_mix,
    tankVolumeLiters: data.tank_volume_liters ? parseFloat(data.tank_volume_liters) : undefined,
    startingPressureBar: data.starting_pressure_bar ? parseFloat(data.starting_pressure_bar) : undefined,
    endingPressureBar: data.ending_pressure_bar ? parseFloat(data.ending_pressure_bar) : undefined,
    weatherConditions: data.weather_conditions,
    seaState: data.sea_state,
    currentStrength: data.current_strength,
    buddyNames: data.buddy_names,
    instructorName: data.instructor_name,
    notes: data.notes,
    highlights: data.highlights,
    wildlifeSpotted: data.wildlife_spotted,
    photoUrls: data.photo_urls,
    difficultyRating: data.difficulty_rating,
    enjoymentRating: data.enjoyment_rating,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}
