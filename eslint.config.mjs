import expo from 'eslint-config-expo';

export default [
  ...expo,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'android/**',
      'ios/**',
    ],
  },
];
