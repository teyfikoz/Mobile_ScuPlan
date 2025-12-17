import {
  CertificationOrganization,
  CertificationLevel,
  DivingSpecialty,
  UserRole,
} from './types';

// Certification Organizations with display names
export const CERTIFICATION_ORGS: Array<{
  value: CertificationOrganization;
  label: string;
  description: string;
}> = [
  { value: 'PADI', label: 'PADI', description: 'Professional Association of Diving Instructors' },
  { value: 'CMAS', label: 'CMAS', description: 'Confédération Mondiale des Activités Subaquatiques' },
  { value: 'SSI', label: 'SSI', description: 'Scuba Schools International' },
  { value: 'NAUI', label: 'NAUI', description: 'National Association of Underwater Instructors' },
  { value: 'TDI', label: 'TDI', description: 'Technical Diving International' },
  { value: 'SDI', label: 'SDI', description: 'Scuba Diving International' },
  { value: 'IANTD', label: 'IANTD', description: 'International Association of Nitrox and Technical Divers' },
  { value: 'GUE', label: 'GUE', description: 'Global Underwater Explorers' },
  { value: 'BSAC', label: 'BSAC', description: 'British Sub-Aqua Club' },
  { value: 'OTHER', label: 'Other', description: 'Other certification organization' },
];

// Certification Levels with display names
export const CERTIFICATION_LEVELS: Array<{
  value: CertificationLevel;
  label: string;
  description: string;
  minDives: number;
}> = [
  { value: 'OPEN_WATER', label: 'Open Water', description: 'Entry level certification', minDives: 0 },
  { value: 'ADVANCED', label: 'Advanced', description: 'Advanced open water diver', minDives: 20 },
  { value: 'RESCUE', label: 'Rescue', description: 'Rescue diver certification', minDives: 50 },
  { value: 'DIVEMASTER', label: 'Divemaster', description: 'Professional diver assistant', minDives: 100 },
  { value: 'INSTRUCTOR', label: 'Instructor', description: 'Certified scuba instructor', minDives: 200 },
  { value: 'MASTER_INSTRUCTOR', label: 'Master Instructor', description: 'Master scuba instructor', minDives: 500 },
  { value: 'TECHNICAL', label: 'Technical', description: 'Technical diving certification', minDives: 100 },
  { value: 'CAVE', label: 'Cave', description: 'Cave diving certification', minDives: 100 },
  { value: 'TRIMIX', label: 'Trimix', description: 'Trimix diving certification', minDives: 100 },
  { value: 'CCR', label: 'CCR/Rebreather', description: 'Closed circuit rebreather', minDives: 50 },
  { value: 'OTHER', label: 'Other', description: 'Other certification', minDives: 0 },
];

// Diving Specialties with display names
export const DIVING_SPECIALTIES: Array<{
  value: DivingSpecialty;
  label: string;
  description: string;
  icon: string;
}> = [
  { value: 'RECREATIONAL', label: 'Recreational', description: 'Standard recreational diving', icon: '🤿' },
  { value: 'TECHNICAL', label: 'Technical', description: 'Technical diving with decompression', icon: '⚙️' },
  { value: 'CAVE', label: 'Cave', description: 'Cave and cavern diving', icon: '🕳️' },
  { value: 'WRECK', label: 'Wreck', description: 'Wreck diving and penetration', icon: '🚢' },
  { value: 'DEEP', label: 'Deep', description: 'Deep diving (> 18m)', icon: '📉' },
  { value: 'NIGHT', label: 'Night', description: 'Night diving', icon: '🌙' },
  { value: 'UNDERWATER_PHOTOGRAPHY', label: 'Photography', description: 'Underwater photography', icon: '📷' },
  { value: 'UNDERWATER_VIDEOGRAPHY', label: 'Videography', description: 'Underwater videography', icon: '🎥' },
  { value: 'SEARCH_AND_RECOVERY', label: 'Search & Recovery', description: 'Search and recovery operations', icon: '🔍' },
  { value: 'NITROX', label: 'Nitrox', description: 'Enriched air nitrox', icon: '🌬️' },
  { value: 'TRIMIX', label: 'Trimix', description: 'Trimix gas blends', icon: '⚗️' },
  { value: 'CCR_REBREATHER', label: 'CCR/Rebreather', description: 'Closed circuit rebreather', icon: '🔄' },
  { value: 'SIDEMOUNT', label: 'Sidemount', description: 'Sidemount configuration', icon: '🎒' },
  { value: 'DPV', label: 'DPV/Scooter', description: 'Diver propulsion vehicle', icon: '🛴' },
  { value: 'ICE', label: 'Ice', description: 'Ice diving', icon: '❄️' },
  { value: 'ALTITUDE', label: 'Altitude', description: 'High altitude diving', icon: '⛰️' },
  { value: 'DRIFT', label: 'Drift', description: 'Drift diving', icon: '🌊' },
  { value: 'BOAT', label: 'Boat', description: 'Boat diving', icon: '⛵' },
  { value: 'SHORE', label: 'Shore', description: 'Shore diving', icon: '🏖️' },
];

// User Roles
export const USER_ROLES: Array<{
  value: UserRole;
  label: string;
  description: string;
}> = [
  { value: 'DIVER', label: 'Diver', description: 'Looking for dive buddies' },
  { value: 'INSTRUCTOR', label: 'Instructor', description: 'Offering instruction and guidance' },
];

// Popular diving countries with cities
export const DIVING_LOCATIONS: Array<{
  country: string;
  countryCode: string;
  cities: string[];
  flag: string;
}> = [
  {
    country: 'Turkey',
    countryCode: 'TR',
    flag: '🇹🇷',
    cities: ['Istanbul', 'Antalya', 'Bodrum', 'Kaş', 'Marmaris', 'Fethiye', 'Ayvalık'],
  },
  {
    country: 'Egypt',
    countryCode: 'EG',
    flag: '🇪🇬',
    cities: ['Sharm El Sheikh', 'Hurghada', 'Dahab', 'Marsa Alam', 'Cairo'],
  },
  {
    country: 'Thailand',
    countryCode: 'TH',
    flag: '🇹🇭',
    cities: ['Phuket', 'Koh Tao', 'Koh Samui', 'Krabi', 'Pattaya', 'Similan Islands'],
  },
  {
    country: 'Indonesia',
    countryCode: 'ID',
    flag: '🇮🇩',
    cities: ['Bali', 'Raja Ampat', 'Komodo', 'Lombok', 'Sulawesi', 'Jakarta'],
  },
  {
    country: 'Maldives',
    countryCode: 'MV',
    flag: '🇲🇻',
    cities: ['Male', 'Ari Atoll', 'Baa Atoll', 'North Male Atoll', 'South Male Atoll'],
  },
  {
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    cities: ['Key West', 'Miami', 'Hawaii', 'California', 'Florida Keys', 'Seattle'],
  },
  {
    country: 'Australia',
    countryCode: 'AU',
    flag: '🇦🇺',
    cities: ['Cairns', 'Great Barrier Reef', 'Sydney', 'Melbourne', 'Perth', 'Brisbane'],
  },
  {
    country: 'Philippines',
    countryCode: 'PH',
    flag: '🇵🇭',
    cities: ['Cebu', 'Palawan', 'Boracay', 'Manila', 'Dumaguete', 'Anilao'],
  },
  {
    country: 'Mexico',
    countryCode: 'MX',
    flag: '🇲🇽',
    cities: ['Cozumel', 'Cancun', 'Playa del Carmen', 'Cabo San Lucas', 'La Paz'],
  },
  {
    country: 'Spain',
    countryCode: 'ES',
    flag: '🇪🇸',
    cities: ['Barcelona', 'Mallorca', 'Canary Islands', 'Costa Brava', 'Valencia'],
  },
  {
    country: 'Greece',
    countryCode: 'GR',
    flag: '🇬🇷',
    cities: ['Athens', 'Crete', 'Santorini', 'Rhodes', 'Mykonos', 'Zakynthos'],
  },
  {
    country: 'Croatia',
    countryCode: 'HR',
    flag: '🇭🇷',
    cities: ['Dubrovnik', 'Split', 'Hvar', 'Vis', 'Kornati', 'Zagreb'],
  },
];

// Language options
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
];

// Helper function to get certification org label
export function getCertificationOrgLabel(org: CertificationOrganization): string {
  return CERTIFICATION_ORGS.find((o) => o.value === org)?.label || org;
}

// Helper function to get certification level label
export function getCertificationLevelLabel(level: CertificationLevel): string {
  return CERTIFICATION_LEVELS.find((l) => l.value === level)?.label || level;
}

// Helper function to get specialty label
export function getSpecialtyLabel(specialty: DivingSpecialty): string {
  return DIVING_SPECIALTIES.find((s) => s.value === specialty)?.label || specialty;
}

// Helper function to get country name from code
export function getCountryName(countryCode: string): string {
  return DIVING_LOCATIONS.find((l) => l.countryCode === countryCode)?.country || countryCode;
}

// Helper function to get country flag
export function getCountryFlag(countryCode: string): string {
  return DIVING_LOCATIONS.find((l) => l.countryCode === countryCode)?.flag || '🌍';
}
