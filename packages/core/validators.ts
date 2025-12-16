import { DivePlan, GasMix, DiveSession, BuddyProfile } from './types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateGasMix(gas: GasMix): void {
  if (gas.o2 < 0 || gas.o2 > 100) {
    throw new ValidationError(`Invalid O2 percentage: ${gas.o2}`);
  }
  if (gas.he < 0 || gas.he > 100) {
    throw new ValidationError(`Invalid He percentage: ${gas.he}`);
  }
  if (gas.o2 + gas.he > 100) {
    throw new ValidationError('O2 + He cannot exceed 100%');
  }
  if (gas.maxPo2 < 0.1 || gas.maxPo2 > 2.0) {
    throw new ValidationError(`Invalid max PO2: ${gas.maxPo2}`);
  }
  if (!gas.name || gas.name.trim().length === 0) {
    throw new ValidationError('Gas name cannot be empty');
  }
}

export function validateDivePlan(plan: DivePlan): void {
  if (!plan.name || plan.name.trim().length === 0) {
    throw new ValidationError('Dive plan name cannot be empty');
  }
  if (plan.maxDepth <= 0) {
    throw new ValidationError('Max depth must be greater than 0');
  }
  if (plan.plannedRuntimeMin <= 0) {
    throw new ValidationError('Planned runtime must be greater than 0');
  }
  if (plan.gases.length === 0) {
    throw new ValidationError('At least one gas mix is required');
  }
  plan.gases.forEach(validateGasMix);
  if (plan.schemaVersion !== 1) {
    throw new ValidationError(`Unsupported schema version: ${plan.schemaVersion}`);
  }
}

export function validateDiveSession(session: DiveSession): void {
  if (session.schemaVersion !== 1) {
    throw new ValidationError(`Unsupported schema version: ${session.schemaVersion}`);
  }
  if (session.startedAt <= 0) {
    throw new ValidationError('Invalid start time');
  }
  if (session.endedAt && session.endedAt < session.startedAt) {
    throw new ValidationError('End time cannot be before start time');
  }
  if (session.pointsCount < 0) {
    throw new ValidationError('Points count cannot be negative');
  }
}

export function validateBuddyProfile(profile: BuddyProfile): void {
  if (!profile.displayName || profile.displayName.trim().length === 0) {
    throw new ValidationError('Display name cannot be empty');
  }
  if (profile.displayName.length > 50) {
    throw new ValidationError('Display name too long');
  }
  if (profile.experienceDives < 0) {
    throw new ValidationError('Experience dives cannot be negative');
  }
  if (profile.languages.length === 0) {
    throw new ValidationError('At least one language is required');
  }
  if (profile.availableUntil <= Date.now()) {
    throw new ValidationError('Availability must be in the future');
  }
}
