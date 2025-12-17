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

// Certification Organizations
export type CertificationOrganization =
  | 'PADI'
  | 'CMAS'
  | 'SSI'
  | 'NAUI'
  | 'TDI'
  | 'SDI'
  | 'IANTD'
  | 'GUE'
  | 'BSAC'
  | 'OTHER';

// Certification Levels
export type CertificationLevel =
  | 'OPEN_WATER'
  | 'ADVANCED'
  | 'RESCUE'
  | 'DIVEMASTER'
  | 'INSTRUCTOR'
  | 'MASTER_INSTRUCTOR'
  | 'TECHNICAL'
  | 'CAVE'
  | 'TRIMIX'
  | 'CCR'
  | 'OTHER';

// Diving Specialties
export type DivingSpecialty =
  | 'RECREATIONAL'
  | 'TECHNICAL'
  | 'CAVE'
  | 'WRECK'
  | 'DEEP'
  | 'NIGHT'
  | 'UNDERWATER_PHOTOGRAPHY'
  | 'UNDERWATER_VIDEOGRAPHY'
  | 'SEARCH_AND_RECOVERY'
  | 'NITROX'
  | 'TRIMIX'
  | 'CCR_REBREATHER'
  | 'SIDEMOUNT'
  | 'DPV'
  | 'ICE'
  | 'ALTITUDE'
  | 'DRIFT'
  | 'BOAT'
  | 'SHORE';

// User Role
export type UserRole = 'DIVER' | 'INSTRUCTOR';

export type BuddyProfile = {
  id: string;
  deviceId: string;
  sessionToken: string;
  displayName: string;
  role: UserRole;
  certificationOrg: CertificationOrganization;
  certificationLevel: CertificationLevel;
  experienceDives: number;
  specialties: DivingSpecialty[];
  languages: string[];
  location: {
    country: string;
    city: string;
    region?: string;
    gridLat: number;
    gridLon: number;
  };
  availableUntil: number;
  createdAt: number;
  bio?: string;
  isInstructor: boolean;
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
