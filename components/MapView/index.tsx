// This file is used as a fallback for TypeScript
// Metro bundler will pick .native.tsx or .web.tsx based on platform
//
// For native platforms: index.native.tsx is used (react-native-maps)
// For web platform: index.web.tsx is used (placeholder)

// TypeScript type definitions (for IDE support)
export { default } from 'react-native-maps';
export type { default as MapViewType, Region, MapMarkerProps, MapPolylineProps } from 'react-native-maps';
export { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
