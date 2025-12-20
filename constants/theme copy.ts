export const colors = {
  primary: '#0077BE',
  primaryDark: '#005A8E',
  secondary: '#00BFA5',
  accent: '#FF6F00',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  white: '#FFFFFF',
  error: '#D32F2F',
  warning: '#FFA726',
  success: '#66BB6A',
  text: {
    primary: '#212121',
    secondary: '#757575',
    inverse: '#FFFFFF',
  },
  underwater: {
    blue: '#0D47A1',
    darkBlue: '#01579B',
    cyan: '#00ACC1',
    surface: '#E1F5FE',
  },
  divider: '#BDBDBD',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 29,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    boxShadow: '0px 1px 1px 0px rgba(0, 0, 0, 0.18)',
    elevation: 1,
  },
  md: {
    boxShadow: '0px 2px 2.62px 0px rgba(0, 0, 0, 0.23)',
    elevation: 4,
  },
  lg: {
    boxShadow: '0px 4px 4.65px 0px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
};
