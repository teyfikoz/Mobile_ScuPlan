// Jest setup file for core logic tests
// No React Native testing library needed for pure logic tests

// Setup crypto global for tests
global.crypto = {
  randomUUID: () => 'test-uuid-1234',
} as any;
