import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CONSENTS: 'consents',
  LOCATION_PERMISSION: 'location_permission_requested',
  BUDDY_PERMISSION: 'buddy_permission_granted',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  ACTIVE_SESSION: 'active_session_id',
  GPS_MODE: 'gps_mode',
} as const;

export type ConsentData = {
  location: boolean;
  buddyFinder: boolean;
  dataCollection: boolean;
  acceptedAt?: number;
};

export async function saveConsents(consents: ConsentData): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.CONSENTS,
    JSON.stringify({
      ...consents,
      acceptedAt: Date.now(),
    })
  );
}

export async function getConsents(): Promise<ConsentData | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.CONSENTS);
  return data ? JSON.parse(data) : null;
}

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  return value === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
}

export async function setActiveSessionId(sessionId: string | null): Promise<void> {
  if (sessionId) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, sessionId);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  }
}

export async function getActiveSessionId(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
}

export async function setGPSMode(mode: 'high' | 'low' | 'underwater'): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.GPS_MODE, mode);
}

export async function getGPSMode(): Promise<'high' | 'low' | 'underwater'> {
  const mode = await AsyncStorage.getItem(STORAGE_KEYS.GPS_MODE);
  return (mode as 'high' | 'low' | 'underwater') || 'high';
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
}
