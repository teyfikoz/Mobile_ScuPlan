import {
  validateGasMix,
  validateDivePlan,
  validateDiveSession,
  validateBuddyProfile,
  ValidationError,
} from '../validators';
import { DivePlan, GasMix, DiveSession, BuddyProfile } from '../types';

describe('Validators', () => {
  describe('validateGasMix', () => {
    const validGas: GasMix = {
      id: '1',
      name: 'Air',
      o2: 21,
      he: 0,
      maxPo2: 1.4,
    };

    it('should accept valid gas mix', () => {
      expect(() => validateGasMix(validGas)).not.toThrow();
    });

    it('should reject invalid O2 percentage', () => {
      expect(() =>
        validateGasMix({ ...validGas, o2: -1 })
      ).toThrow(ValidationError);
      expect(() =>
        validateGasMix({ ...validGas, o2: 101 })
      ).toThrow(ValidationError);
    });

    it('should reject invalid He percentage', () => {
      expect(() =>
        validateGasMix({ ...validGas, he: -1 })
      ).toThrow(ValidationError);
      expect(() =>
        validateGasMix({ ...validGas, he: 101 })
      ).toThrow(ValidationError);
    });

    it('should reject O2 + He > 100', () => {
      expect(() =>
        validateGasMix({ ...validGas, o2: 60, he: 50 })
      ).toThrow(ValidationError);
    });

    it('should reject invalid maxPo2', () => {
      expect(() =>
        validateGasMix({ ...validGas, maxPo2: 0.05 })
      ).toThrow(ValidationError);
      expect(() =>
        validateGasMix({ ...validGas, maxPo2: 2.5 })
      ).toThrow(ValidationError);
    });

    it('should reject empty gas name', () => {
      expect(() =>
        validateGasMix({ ...validGas, name: '' })
      ).toThrow(ValidationError);
    });
  });

  describe('validateDivePlan', () => {
    const validPlan: DivePlan = {
      id: '1',
      schemaVersion: 1,
      name: 'Test Plan',
      unitSystem: 'metric',
      maxDepth: 30,
      plannedRuntimeMin: 45,
      gases: [
        {
          id: '1',
          name: 'Air',
          o2: 21,
          he: 0,
          maxPo2: 1.4,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should accept valid dive plan', () => {
      expect(() => validateDivePlan(validPlan)).not.toThrow();
    });

    it('should reject empty name', () => {
      expect(() =>
        validateDivePlan({ ...validPlan, name: '' })
      ).toThrow(ValidationError);
    });

    it('should reject invalid depth', () => {
      expect(() =>
        validateDivePlan({ ...validPlan, maxDepth: 0 })
      ).toThrow(ValidationError);
      expect(() =>
        validateDivePlan({ ...validPlan, maxDepth: -10 })
      ).toThrow(ValidationError);
    });

    it('should reject invalid runtime', () => {
      expect(() =>
        validateDivePlan({ ...validPlan, plannedRuntimeMin: 0 })
      ).toThrow(ValidationError);
    });

    it('should reject plan without gases', () => {
      expect(() =>
        validateDivePlan({ ...validPlan, gases: [] })
      ).toThrow(ValidationError);
    });

    it('should reject unsupported schema version', () => {
      expect(() =>
        validateDivePlan({ ...validPlan, schemaVersion: 2 as 1 })
      ).toThrow(ValidationError);
    });
  });

  describe('validateDiveSession', () => {
    const validSession: DiveSession = {
      id: '1',
      schemaVersion: 1,
      status: 'active',
      pointsCount: 0,
      startedAt: Date.now(),
    };

    it('should accept valid session', () => {
      expect(() => validateDiveSession(validSession)).not.toThrow();
    });

    it('should reject unsupported schema version', () => {
      expect(() =>
        validateDiveSession({ ...validSession, schemaVersion: 2 as 1 })
      ).toThrow(ValidationError);
    });

    it('should reject invalid start time', () => {
      expect(() =>
        validateDiveSession({ ...validSession, startedAt: 0 })
      ).toThrow(ValidationError);
    });

    it('should reject end time before start time', () => {
      expect(() =>
        validateDiveSession({
          ...validSession,
          startedAt: Date.now(),
          endedAt: Date.now() - 1000,
        })
      ).toThrow(ValidationError);
    });

    it('should reject negative points count', () => {
      expect(() =>
        validateDiveSession({ ...validSession, pointsCount: -1 })
      ).toThrow(ValidationError);
    });
  });

  describe('validateBuddyProfile', () => {
    const validProfile: BuddyProfile = {
      id: '1',
      deviceId: 'hashed-device-id',
      sessionToken: 'token',
      displayName: 'John Doe',
      certification: 'PADI_ADVANCED',
      experienceDives: 50,
      languages: ['en', 'tr'],
      location: {
        gridLat: 37.77,
        gridLon: -122.42,
      },
      availableUntil: Date.now() + 86400000, // +24 hours
      createdAt: Date.now(),
    };

    it('should accept valid buddy profile', () => {
      expect(() => validateBuddyProfile(validProfile)).not.toThrow();
    });

    it('should reject empty display name', () => {
      expect(() =>
        validateBuddyProfile({ ...validProfile, displayName: '' })
      ).toThrow(ValidationError);
    });

    it('should reject too long display name', () => {
      expect(() =>
        validateBuddyProfile({
          ...validProfile,
          displayName: 'a'.repeat(51),
        })
      ).toThrow(ValidationError);
    });

    it('should reject negative experience dives', () => {
      expect(() =>
        validateBuddyProfile({ ...validProfile, experienceDives: -1 })
      ).toThrow(ValidationError);
    });

    it('should reject empty languages array', () => {
      expect(() =>
        validateBuddyProfile({ ...validProfile, languages: [] })
      ).toThrow(ValidationError);
    });

    it('should reject past availability time', () => {
      expect(() =>
        validateBuddyProfile({
          ...validProfile,
          availableUntil: Date.now() - 1000,
        })
      ).toThrow(ValidationError);
    });
  });
});
