export type UnitSystem = 'metric' | 'imperial';

export type GasMix = {
  id: string;
  name: string;
  o2: number;
  he: number;
  maxPo2: number;
};

export type DivePlan = {
  id: string;
  schemaVersion: 1;
  name: string;
  notes?: string;
  location?: {
    name?: string;
    lat?: number;
    lon?: number;
  };
  unitSystem: UnitSystem;
  maxDepth: number;
  plannedRuntimeMin: number;
  gases: GasMix[];
  createdAt: number;
  updatedAt: number;
};

export type GeoPoint = {
  lat: number;
  lon: number;
  ts: number;
  accuracyM?: number;
};

export type DiveSession = {
  id: string;
  schemaVersion: 1;
  planId?: string;
  status: 'active' | 'completed';
  entry?: GeoPoint;
  exit?: GeoPoint;
  pointsCount: number;
  startedAt: number;
  endedAt?: number;
  stats?: {
    durationSec: number;
    maxDistanceFromEntryM: number;
    totalTrackDistanceM: number;
  };
  notes?: string;
};

export type CertificationLevel =
  | 'CMAS_1_STAR'
  | 'CMAS_2_STAR'
  | 'CMAS_3_STAR'
  | 'PADI_OPEN_WATER'
  | 'PADI_ADVANCED'
  | 'PADI_RESCUE'
  | 'PADI_DIVEMASTER'
  | 'SSI_OPEN_WATER'
  | 'SSI_ADVANCED'
  | 'TDI_INTRO_TECH'
  | 'TDI_ADVANCED_NITROX'
  | 'OTHER';

export type BuddyProfile = {
  id: string;
  deviceId: string;
  sessionToken: string;
  displayName: string;
  certification: CertificationLevel;
  experienceDives: number;
  languages: string[];
  location: {
    gridLat: number;
    gridLon: number;
  };
  availableUntil: number;
  createdAt: number;
};

export type ContactRequest = {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: number;
  expiresAt: number;
};
