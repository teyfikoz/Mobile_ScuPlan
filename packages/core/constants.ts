export const SAFETY_DISCLAIMER =
  'ScuPlan is a planning and logging aid. Always follow your dive computer and training.';

export const DEFAULT_GAS_MIXES = {
  AIR: { o2: 21, he: 0, name: 'Air' },
  EAN32: { o2: 32, he: 0, name: 'EAN32' },
  EAN36: { o2: 36, he: 0, name: 'EAN36' },
  TX_18_45: { o2: 18, he: 45, name: 'Tx18/45' },
  TX_21_35: { o2: 21, he: 35, name: 'Tx21/35' },
};

export const GPS_CONFIG = {
  HIGH_ACCURACY_INTERVAL: 5000,
  LOW_ACCURACY_INTERVAL: 30000,
  UNDERWATER_INTERVAL: 300000,
  MIN_DISTANCE: 10,
};

export const BUDDY_CONFIG = {
  MAX_RADIUS_METERS: 5000,
  DEFAULT_RADIUS_METERS: 500,
  SESSION_TTL_HOURS: 24,
  GRID_SIZE_DEGREES: 0.01,
  MAX_CONTACT_REQUESTS: 10,
};

export const SESSION_CONFIG = {
  MAX_TRACK_POINTS: 10000,
  STATS_UPDATE_INTERVAL: 10000,
};

export const CERTIFICATION_LEVELS = {
  CMAS_1_STAR: 'CMAS 1 Star',
  CMAS_2_STAR: 'CMAS 2 Star',
  CMAS_3_STAR: 'CMAS 3 Star',
  PADI_OPEN_WATER: 'PADI Open Water',
  PADI_ADVANCED: 'PADI Advanced',
  PADI_RESCUE: 'PADI Rescue Diver',
  PADI_DIVEMASTER: 'PADI Divemaster',
  SSI_OPEN_WATER: 'SSI Open Water',
  SSI_ADVANCED: 'SSI Advanced',
  TDI_INTRO_TECH: 'TDI Intro to Tech',
  TDI_ADVANCED_NITROX: 'TDI Advanced Nitrox',
  OTHER: 'Other',
};
