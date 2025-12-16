import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../components/MapView';
import {
  X,
  MapPin,
  Navigation,
  Clock,
  Pause,
  Play,
  Square,
} from 'lucide-react-native';
import { colors, spacing, typography } from '../constants/theme';
import Button from '../components/Button';
import SafetyDisclaimer from '../components/SafetyDisclaimer';
import { useLocation, GPSMode } from '../hooks/useLocation';
import {
  createDiveSession,
  updateDiveSession,
  addTrackPoint,
  completeDiveSession,
  getDiveSession,
  getTrackPoints,
} from '../services/diveSessions';
import { DiveSession, GeoPoint } from '../packages/core/types';
import {
  calculateDistance,
  calculateBearing,
  formatDistance,
  formatDuration,
} from '../packages/core/calculators';
import {
  setActiveSessionId,
  getActiveSessionId,
} from '../lib/storage';

export default function SessionScreen() {
  const router = useRouter();
  const { location, hasPermission, requestPermission, startTracking, stopTracking, getCurrentLocation } = useLocation();
  const [session, setSession] = useState<DiveSession | null>(null);
  const [trackPoints, setTrackPoints] = useState<GeoPoint[]>([]);
  const [gpsMode, setGPSMode] = useState<GPSMode>('high');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkExistingSession();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (session && session.status === 'active') {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [session]);

  useEffect(() => {
    if (session && session.status === 'active' && location) {
      handleNewLocationPoint(location);
    }
  }, [location]);

  const checkExistingSession = async () => {
    const sessionId = await getActiveSessionId();
    if (sessionId) {
      const existingSession = await getDiveSession(sessionId);
      if (existingSession && existingSession.status === 'active') {
        setSession(existingSession);
        const points = await getTrackPoints(sessionId);
        setTrackPoints(points);
        startTracking('high');
      }
    }
  };

  const handleNewLocationPoint = async (point: GeoPoint) => {
    if (!session) return;

    await addTrackPoint(session.id, point);
    setTrackPoints((prev) => [...prev, point]);
  };

  const handleStartSession = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Error', 'Location permission is required');
        return;
      }
    }

    setLoading(true);
    try {
      const newSession = await createDiveSession();
      setSession(newSession);
      await setActiveSessionId(newSession.id);
      startTracking('high');
    } catch (error) {
      Alert.alert('Error', 'Failed to start session');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkEntry = async () => {
    if (!session) return;

    const currentLoc = await getCurrentLocation();
    if (!currentLoc) {
      Alert.alert('Error', 'Could not get current location');
      return;
    }

    try {
      const updated = await updateDiveSession(session.id, {
        entry: currentLoc,
      });
      setSession(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark entry point');
    }
  };

  const handleMarkExit = async () => {
    if (!session) return;

    const currentLoc = await getCurrentLocation();
    if (!currentLoc) {
      Alert.alert('Error', 'Could not get current location');
      return;
    }

    try {
      const updated = await updateDiveSession(session.id, {
        exit: currentLoc,
      });
      setSession(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark exit point');
    }
  };

  const handleToggleGPSMode = () => {
    const modes: GPSMode[] = ['high', 'low', 'underwater'];
    const currentIndex = modes.indexOf(gpsMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setGPSMode(nextMode);
    startTracking(nextMode);
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Dive Session',
      'Are you sure you want to end this dive session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            if (!session) return;

            try {
              await completeDiveSession(session.id);
              await setActiveSessionId(null);
              stopTracking();
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to end session');
            }
          },
        },
      ]
    );
  };

  const getDistanceToEntry = (): string => {
    if (!session?.entry || !location) return '--';
    const distance = calculateDistance(session.entry, location);
    return formatDistance(distance);
  };

  const getBearingToEntry = (): number => {
    if (!session?.entry || !location) return 0;
    return calculateBearing(location, session.entry);
  };

  const renderMap = () => {
    if (!session?.entry && !location) {
      return (
        <View style={styles.mapPlaceholder}>
          <MapPin size={64} color={colors.text.secondary} />
          <Text style={styles.mapPlaceholderText}>
            Waiting for GPS location...
          </Text>
        </View>
      );
    }

    const region = session?.entry
      ? {
          latitude: session.entry.lat,
          longitude: session.entry.lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : location
      ? {
          latitude: location.lat,
          longitude: location.lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : undefined;

    return (
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {session?.entry && (
          <Marker
            coordinate={{
              latitude: session.entry.lat,
              longitude: session.entry.lon,
            }}
            title="Entry Point"
            pinColor={colors.secondary}
          />
        )}

        {session?.exit && (
          <Marker
            coordinate={{
              latitude: session.exit.lat,
              longitude: session.exit.lon,
            }}
            title="Exit Point"
            pinColor={colors.error}
          />
        )}

        {trackPoints.length > 0 && (
          <Polyline
            coordinates={trackPoints.map((p) => ({
              latitude: p.lat,
              longitude: p.lon,
            }))}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        )}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dive Session</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <SafetyDisclaimer variant="banner" />

      {renderMap()}

      <View style={styles.controls}>
        {!session ? (
          <View style={styles.startContainer}>
            <Button
              title="Start Dive"
              onPress={handleStartSession}
              variant="primary"
              size="large"
              loading={loading}
            />
          </View>
        ) : (
          <>
            <View style={styles.stats}>
              <View style={styles.statBox}>
                <Clock size={24} color={colors.primary} />
                <Text style={styles.statValue}>{formatDuration(elapsedTime)}</Text>
                <Text style={styles.statLabel}>Elapsed Time</Text>
              </View>

              <View style={styles.statBox}>
                <Navigation size={24} color={colors.primary} />
                <Text style={styles.statValue}>{getDistanceToEntry()}</Text>
                <Text style={styles.statLabel}>To Entry</Text>
              </View>

              <View style={styles.statBox}>
                <MapPin size={24} color={colors.primary} />
                <Text style={styles.statValue}>{trackPoints.length}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                title={session.entry ? 'Entry Marked' : 'Mark Entry'}
                onPress={handleMarkEntry}
                variant={session.entry ? 'outline' : 'secondary'}
                size="medium"
                disabled={!!session.entry}
                style={styles.actionButton}
              />

              <Button
                title="GPS Mode"
                onPress={handleToggleGPSMode}
                variant="outline"
                size="medium"
                style={styles.actionButton}
              />

              <Button
                title={session.exit ? 'Exit Marked' : 'Mark Exit'}
                onPress={handleMarkExit}
                variant={session.exit ? 'outline' : 'secondary'}
                size="medium"
                disabled={!!session.exit}
                style={styles.actionButton}
              />
            </View>

            <Button
              title="End Session"
              onPress={handleEndSession}
              variant="danger"
              size="large"
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  mapPlaceholderText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  controls: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  startContainer: {
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
