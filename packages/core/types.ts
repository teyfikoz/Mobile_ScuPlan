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

// User Profile (Authenticated Users)
export type UserProfile = {
  id: string;
  email: string;
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  certificationOrg?: CertificationOrganization;
  certificationLevel?: CertificationLevel;
  experienceDives: number;
  specialties: DivingSpecialty[];
  country?: string;
  city?: string;
  region?: string;
  profileVisible: boolean;
  locationSharingEnabled: boolean;
  showRealName: boolean;
  gdprConsentGiven: boolean;
  gdprConsentDate?: number;
  kvkkConsentGiven: boolean;
  kvkkConsentDate?: number;
  termsAccepted: boolean;
  termsAcceptedDate?: number;
  marketingConsent: boolean;
  totalDives: number;
  totalDiveTimeMinutes: number;
  maxDepthMeters: number;
  lastDiveDate?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
};

// Dive Log Entry
export type DiveHistoryEntry = {
  id: string;
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
  createdAt: number;
  updatedAt: number;
};

// User Consent for GDPR/KVKK
export type UserConsent = {
  id: string;
  userId: string;
  consentType: 'GDPR' | 'KVKK' | 'TERMS' | 'MARKETING';
  consentVersion: string;
  consentText: string;
  granted: boolean;
  grantedAt: number;
  ipAddress?: string;
  userAgent?: string;
};
