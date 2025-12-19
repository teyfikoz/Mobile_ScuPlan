// This file provides minimal Jest/Mocha test globals for TypeScript during CI/typecheck
// It avoids needing @types/jest in CI when running `tsc --noEmit`.

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;
declare function beforeAll(fn: () => void): void;
declare function afterAll(fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;

declare const expect: any;
