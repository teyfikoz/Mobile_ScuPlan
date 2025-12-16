import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    let deviceId = await AsyncStorage.getItem('device_id');

    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem('device_id', deviceId);
    }

    cachedDeviceId = deviceId;
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    throw error;
  }
}

export async function hashDeviceId(deviceId: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    deviceId
  );
  return digest;
}

export async function setDeviceIdContext() {
  const deviceId = await getDeviceId();
  const { error } = await supabase.rpc('set_config', {
    setting_name: 'app.device_id',
    setting_value: deviceId,
  });

  if (error) {
    console.error('Error setting device ID context:', error);
  }
}
