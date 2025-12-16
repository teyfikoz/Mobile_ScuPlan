import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { GeoPoint } from '../packages/core/types';
import { GPS_CONFIG } from '../packages/core/constants';

export type GPSMode = 'high' | 'low' | 'underwater' | 'off';

type UseLocationReturn = {
  location: GeoPoint | null;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: (mode: GPSMode) => void;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<GeoPoint | null>;
};

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const currentModeRef = useRef<GPSMode>('off');

  useEffect(() => {
    checkPermission();

    return () => {
      stopTracking();
    };
  }, []);

  const checkPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (granted) {
        const bgStatus = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus.status !== 'granted') {
          setError(
            'Background location permission required for tracking during dive'
          );
        }
      }

      return granted;
    } catch (err) {
      setError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<GeoPoint | null> => {
    try {
      if (!hasPermission) {
        setError('Location permission not granted');
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const point: GeoPoint = {
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
        ts: Date.now(),
        accuracyM: loc.coords.accuracy || undefined,
      };

      setLocation(point);
      return point;
    } catch (err) {
      setError('Failed to get current location');
      return null;
    }
  };

  const startTracking = async (mode: GPSMode) => {
    if (!hasPermission) {
      setError('Location permission not granted');
      return;
    }

    if (subscriptionRef.current) {
      await subscriptionRef.current.remove();
    }

    currentModeRef.current = mode;

    let accuracy: Location.Accuracy;
    let timeInterval: number;

    switch (mode) {
      case 'high':
        accuracy = Location.Accuracy.High;
        timeInterval = GPS_CONFIG.HIGH_ACCURACY_INTERVAL;
        break;
      case 'low':
        accuracy = Location.Accuracy.Balanced;
        timeInterval = GPS_CONFIG.LOW_ACCURACY_INTERVAL;
        break;
      case 'underwater':
        accuracy = Location.Accuracy.Lowest;
        timeInterval = GPS_CONFIG.UNDERWATER_INTERVAL;
        break;
      case 'off':
      default:
        return;
    }

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval,
          distanceInterval: GPS_CONFIG.MIN_DISTANCE,
        },
        (loc) => {
          const point: GeoPoint = {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            ts: Date.now(),
            accuracyM: loc.coords.accuracy || undefined,
          };
          setLocation(point);
        }
      );

      subscriptionRef.current = subscription;
      setError(null);
    } catch (err) {
      setError('Failed to start location tracking');
    }
  };

  const stopTracking = async () => {
    if (subscriptionRef.current) {
      await subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    currentModeRef.current = 'off';
  };

  return {
    location,
    error,
    hasPermission,
    requestPermission,
    startTracking,
    stopTracking,
    getCurrentLocation,
  };
}
