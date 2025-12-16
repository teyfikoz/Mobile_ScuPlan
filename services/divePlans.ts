import { supabase, getDeviceId, setDeviceIdContext } from '../lib/supabase';
import { DivePlan, GasMix } from '../packages/core/types';
import { validateDivePlan } from '../packages/core/validators';

export async function createDivePlan(
  planData: Omit<DivePlan, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DivePlan> {
  const deviceId = await getDeviceId();
  await setDeviceIdContext();

  const plan: DivePlan = {
    ...planData,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  validateDivePlan(plan);

  const { data, error } = await supabase
    .from('dive_plans')
    .insert({
      id: plan.id,
      device_id: deviceId,
      schema_version: plan.schemaVersion,
      name: plan.name,
      notes: plan.notes,
      location_name: plan.location?.name,
      location_lat: plan.location?.lat,
      location_lon: plan.location?.lon,
      unit_system: plan.unitSystem,
      max_depth: plan.maxDepth,
      planned_runtime_min: plan.plannedRuntimeMin,
      gases: plan.gases,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create dive plan: ${error.message}`);
  }

  return mapDbToPlan(data);
}

export async function getAllDivePlans(): Promise<DivePlan[]> {
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('dive_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch dive plans: ${error.message}`);
  }

  return (data || []).map(mapDbToPlan);
}

export async function getDivePlan(id: string): Promise<DivePlan | null> {
  await setDeviceIdContext();

  const { data, error } = await supabase
    .from('dive_plans')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch dive plan: ${error.message}`);
  }

  return data ? mapDbToPlan(data) : null;
}

export async function updateDivePlan(
  id: string,
  updates: Partial<Omit<DivePlan, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<DivePlan> {
  await setDeviceIdContext();

  const existing = await getDivePlan(id);
  if (!existing) {
    throw new Error('Dive plan not found');
  }

  const updated: DivePlan = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  validateDivePlan(updated);

  const { data, error } = await supabase
    .from('dive_plans')
    .update({
      name: updated.name,
      notes: updated.notes,
      location_name: updated.location?.name,
      location_lat: updated.location?.lat,
      location_lon: updated.location?.lon,
      unit_system: updated.unitSystem,
      max_depth: updated.maxDepth,
      planned_runtime_min: updated.plannedRuntimeMin,
      gases: updated.gases,
      updated_at: new Date(updated.updatedAt).toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update dive plan: ${error.message}`);
  }

  return mapDbToPlan(data);
}

export async function deleteDivePlan(id: string): Promise<void> {
  await setDeviceIdContext();

  const { error } = await supabase.from('dive_plans').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete dive plan: ${error.message}`);
  }
}

function mapDbToPlan(data: any): DivePlan {
  return {
    id: data.id,
    schemaVersion: data.schema_version,
    name: data.name,
    notes: data.notes,
    location: data.location_name || data.location_lat || data.location_lon
      ? {
          name: data.location_name,
          lat: data.location_lat,
          lon: data.location_lon,
        }
      : undefined,
    unitSystem: data.unit_system,
    maxDepth: parseFloat(data.max_depth),
    plannedRuntimeMin: data.planned_runtime_min,
    gases: data.gases as GasMix[],
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

export function exportPlanToJSON(plan: DivePlan): string {
  return JSON.stringify(plan, null, 2);
}

export function importPlanFromJSON(json: string): DivePlan {
  const plan = JSON.parse(json) as DivePlan;
  validateDivePlan(plan);
  return plan;
}

export function createDeepLink(plan: DivePlan): string {
  const payload = btoa(JSON.stringify(plan));
  return `scuplan://plan?v=1&payload=${payload}`;
}

export function parseDeepLink(url: string): DivePlan | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'scuplan:' || urlObj.pathname !== '//plan') {
      return null;
    }

    const version = urlObj.searchParams.get('v');
    const payload = urlObj.searchParams.get('payload');

    if (version !== '1' || !payload) {
      return null;
    }

    const json = atob(payload);
    return importPlanFromJSON(json);
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
}
