// Web platform - provide placeholder components
// react-native-maps doesn't work on web, so we show a message
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { colors, spacing, typography } from '../../constants/theme';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  pinColor?: string;
}

export interface MapPolylineProps {
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  strokeColor?: string;
  strokeWidth?: number;
}

interface MapViewProps {
  style?: ViewStyle;
  initialRegion?: Region;
  provider?: string;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  children?: React.ReactNode;
}

// Placeholder MapView for web
const MapView = forwardRef<any, MapViewProps>((props, ref) => {
  return (
    <View style={[styles.container, props.style]}>
      <MapPin size={64} color={colors.text.secondary} />
      <Text style={styles.title}>Map View</Text>
      <Text style={styles.subtitle}>
        Maps are only available on iOS and Android
      </Text>
      <Text style={styles.hint}>
        Run the app with:
      </Text>
      <Text style={styles.code}>
        npx expo run:ios{'\n'}
        npx expo run:android
      </Text>
    </View>
  );
});

// Placeholder Marker for web
export const Marker: React.FC<MapMarkerProps> = () => null;

// Placeholder Polyline for web
export const Polyline: React.FC<MapPolylineProps> = () => null;

// Placeholder PROVIDER_GOOGLE for web
export const PROVIDER_GOOGLE = 'google';

export default MapView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  code: {
    ...typography.caption,
    fontFamily: 'monospace',
    color: colors.primary,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
