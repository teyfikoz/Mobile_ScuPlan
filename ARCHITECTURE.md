# ScuPlan Mobile - Technical Architecture

## System Overview

ScuPlan Mobile is a safety-critical dive planning application built with Expo (React Native) and Supabase, designed for offline-first operation with privacy-first principles.

---

## Architecture Principles

### 1. Safety-Critical Design
- **No crashes during dive** - Extensive error handling
- **Offline-first** - All core features work without network
- **Data integrity** - Validation at every layer
- **Battery optimization** - Adaptive GPS sampling
- **Clear disclaimers** - User safety awareness

### 2. Privacy-First
- **No user accounts** - Device-based identity
- **Minimal data collection** - Only what's needed
- **GDPR compliant** - Explicit consent, data export/delete
- **Local-first storage** - Sync is optional
- **Grid-rounded locations** - Privacy in buddy finder

### 3. Offline-First
- **Local database** - AsyncStorage + Supabase offline
- **Sync when available** - Background sync (planned)
- **Conflict resolution** - Last-write-wins with schema versioning
- **Graceful degradation** - Core features always work

---

## Data Architecture

### Schema Versioning

All data models include `schemaVersion` field for migration support:

```typescript
{
  schemaVersion: 1,  // Enables future migrations
  // ... data
}
```

**Migration Strategy:**
1. Increment schema version
2. Write migration code in `packages/core/validators.ts`
3. Handle old + new versions during transition
4. Never destructive - always additive

### Device Identity

**Device ID:**
- Generated on first launch
- Stored in AsyncStorage
- Used for RLS (Row Level Security)
- Hashed for buddy system

**No Authentication:**
- No passwords or emails
- Device = identity
- Data tied to device
- Export/import for device migration

### Data Flow

```
User Action
    ↓
Component State (React)
    ↓
Service Layer (services/*.ts)
    ↓
Validation (packages/core/validators.ts)
    ↓
Supabase Client (lib/supabase.ts)
    ↓
PostgreSQL (with RLS)
```

**Read Path:**
1. Check local cache (React state)
2. Query Supabase
3. Apply RLS filters
4. Map DB → TypeScript types
5. Validate schema version
6. Return to component

**Write Path:**
1. Validate data (client-side)
2. Set device ID context
3. Insert/Update via Supabase
4. RLS enforces permissions
5. Return updated data
6. Update local state

---

## Database Schema Details

### dive_plans

**Purpose:** Store dive plans with multi-gas support

**Columns:**
- `id` (uuid) - Primary key
- `device_id` (text) - Device identifier
- `schema_version` (int) - Data version
- `name` (text) - Plan name
- `notes` (text) - Optional notes
- `location_name`, `location_lat`, `location_lon` - Optional location
- `unit_system` (text) - 'metric' | 'imperial'
- `max_depth` (numeric) - Maximum depth
- `planned_runtime_min` (int) - Planned runtime
- `gases` (jsonb) - Array of gas mixes
- `created_at`, `updated_at` - Timestamps

**RLS Policies:**
- Devices can only access their own plans
- All CRUD operations scoped to `device_id`

**Indexes:**
- `device_id` (query performance)
- `created_at DESC` (sorting)

### dive_sessions

**Purpose:** Track active and completed dive sessions

**Columns:**
- `id` (uuid) - Primary key
- `device_id` (text) - Device identifier
- `schema_version` (int) - Data version
- `plan_id` (uuid) - Optional FK to dive_plans
- `status` (text) - 'active' | 'completed'
- `entry_lat`, `entry_lon`, `entry_ts`, `entry_accuracy_m` - Entry point
- `exit_lat`, `exit_lon`, `exit_ts`, `exit_accuracy_m` - Exit point
- `points_count` (int) - Number of track points
- `started_at`, `ended_at` - Session times
- `duration_sec`, `max_distance_from_entry_m`, `total_track_distance_m` - Stats
- `notes` (text) - Optional notes

**RLS Policies:**
- Device-scoped access
- Cascading delete on plan deletion

**Indexes:**
- `device_id`, `status` (active session queries)
- `started_at DESC` (log display)

### track_points

**Purpose:** Store GPS tracking points during dive session

**Columns:**
- `id` (uuid) - Primary key
- `session_id` (uuid) - FK to dive_sessions
- `lat`, `lon` (double precision) - Coordinates
- `ts` (timestamptz) - Timestamp
- `accuracy_m` (numeric) - GPS accuracy
- `sequence` (int) - Order in track

**RLS Policies:**
- Access via session ownership
- CASCADE delete when session deleted

**Indexes:**
- `session_id` (query all points for session)
- `(session_id, sequence)` (ordered retrieval)

**Performance:**
- Max 10,000 points per session
- Batch insert optimization (planned)

### buddy_profiles

**Purpose:** Privacy-first buddy discovery

**Columns:**
- `id` (uuid) - Primary key
- `device_id` (text) - Hashed device ID
- `session_token` (text) - Rotating token
- `display_name` (text) - User-chosen name
- `certification` (text) - Cert level
- `experience_dives` (int) - Dive count
- `languages` (jsonb) - Spoken languages
- `grid_lat`, `grid_lon` (numeric) - Rounded location (~1km)
- `available_until` (timestamptz) - TTL expiry
- `created_at` - Creation time

**RLS Policies:**
- All users can read non-expired profiles (discovery)
- Devices can only insert/update/delete own profile

**Privacy Features:**
- Grid rounding (0.01 degrees ≈ 1km)
- TTL auto-expire (24h)
- Hashed device IDs
- No precise location

**Indexes:**
- `(grid_lat, grid_lon)` (spatial queries)
- `available_until` (TTL cleanup)
- `device_id` (ownership)

### contact_requests

**Purpose:** Buddy contact request system

**Columns:**
- `id` (uuid) - Primary key
- `from_device_id` (text) - Sender
- `to_device_id` (text) - Receiver
- `status` (text) - 'pending' | 'accepted' | 'declined'
- `message` (text) - Optional message
- `created_at` - Creation time
- `expires_at` (timestamptz) - Auto-expire

**RLS Policies:**
- Users can read requests where they're sender OR receiver
- Only sender can insert
- Only receiver can update status

**TTL:**
- 24h expiration
- Periodic cleanup job (external)

---

## GPS & Location Architecture

### Location Hook (`hooks/useLocation.ts`)

**Features:**
- Permission management
- Adaptive sampling
- Background tracking (session-only)
- Error handling

**GPS Modes:**

```typescript
type GPSMode = 'high' | 'low' | 'underwater' | 'off';
```

| Mode | Interval | Accuracy | Use Case |
|------|----------|----------|----------|
| high | 5s | High | Active diving, entry/exit marking |
| low | 30s | Balanced | Surface tracking, battery saving |
| underwater | 5min | Lowest | Manual toggle, minimal battery |
| off | - | - | Session ended |

**Configuration:**

```typescript
export const GPS_CONFIG = {
  HIGH_ACCURACY_INTERVAL: 5000,      // 5s
  LOW_ACCURACY_INTERVAL: 30000,      // 30s
  UNDERWATER_INTERVAL: 300000,       // 5min
  MIN_DISTANCE: 10,                  // 10m
};
```

### Background Tracking

**Session-Only Policy:**
- Background permission requested
- Tracking starts with "Start Dive"
- Stops with "End Session"
- No tracking when app closed

**Implementation:**
```typescript
// Start tracking
await Location.watchPositionAsync({
  accuracy: Location.Accuracy.High,
  timeInterval: GPS_CONFIG.HIGH_ACCURACY_INTERVAL,
  distanceInterval: GPS_CONFIG.MIN_DISTANCE,
}, callback);

// Stop tracking
await subscription.remove();
await setActiveSessionId(null);
```

### Battery Optimization

**Strategies:**
1. Adaptive sampling (mode-based)
2. Distance threshold (10m minimum)
3. Subscription cleanup
4. No GPS when underwater (manual toggle)
5. Kill-switch on session end

**Battery Impact Estimates:**
- High mode: ~5-10% per hour
- Low mode: ~2-5% per hour
- Underwater mode: <1% per hour

---

## Calculations & Safety

### Gas Mix Calculations

**MOD (Maximum Operating Depth):**
```typescript
MOD = ((maxPO2 / (O2% / 100)) - 1) * 10
```

**EAD (Equivalent Air Depth):**
```typescript
fN2 = (100 - O2%) / 100
EAD = ((depth + 10) * fN2) - 10
```

**Validation:**
- O2 + He ≤ 100%
- O2: 1-100%
- He: 0-100%
- maxPO2: 0.1-2.0 bar

### Navigation Calculations

**Haversine Distance:**
```typescript
distance = 2 * R * asin(sqrt(
  sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)
))
```
- R = 6371000m (Earth radius)
- φ = latitude (radians)
- λ = longitude (radians)

**Bearing:**
```typescript
θ = atan2(
  sin(Δλ) * cos(φ2),
  cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ)
)
bearing = (θ * 180/π + 360) % 360
```

### Track Statistics

**Computed on session end:**
- `durationSec` - Total session time
- `maxDistanceFromEntryM` - Furthest point from entry
- `totalTrackDistanceM` - Sum of segment distances

---

## Import/Export

### Deep Link Format

**URL Scheme:**
```
scuplan://plan?v=1&payload=<base64>
```

**Payload:**
- Base64-encoded JSON
- Full DivePlan object
- Schema version included

**Example:**
```typescript
const deepLink = createDeepLink(plan);
// scuplan://plan?v=1&payload=eyJpZCI6...

const plan = parseDeepLink(url);
// Returns DivePlan or null
```

### QR Code (Planned)

**Format:**
- Same as deep link
- QR contains full URL
- Scan → auto-import

**Use Cases:**
- Share plan with buddy
- Sync between devices
- Import from web planner

---

## Security & RLS

### Row Level Security

**Concept:**
- PostgreSQL-level security
- Policies evaluated per query
- Device ID context required

**Implementation:**

```sql
-- Set device context before query
SELECT set_config('app.device_id', 'device-uuid', false);

-- RLS policy
CREATE POLICY "Devices can read own plans"
  ON dive_plans
  FOR SELECT
  USING (device_id = current_setting('app.device_id', true));
```

**Client Usage:**

```typescript
// Automatic in all queries
await setDeviceIdContext();
const plans = await getAllDivePlans();
// RLS filters to device's plans only
```

### Threat Model

**Protected Against:**
- Unauthorized data access (RLS)
- Device spoofing (hashed IDs for buddy)
- SQL injection (Supabase client)
- XSS (React Native, no web views)

**NOT Protected Against:**
- Physical device access (local storage readable)
- Rooted/jailbroken devices
- Man-in-the-middle (HTTPS mitigates)

**Mitigation:**
- Encrypt sensitive local data (planned)
- Certificate pinning (planned)
- Tamper detection (planned)

---

## Error Handling

### Strategy

**Layers:**
1. Input validation (validators.ts)
2. Service layer try/catch
3. Component error boundaries (planned)
4. Global error handler (planned)

**User Experience:**
- Show errors inline (not Alert)
- Graceful degradation
- Offline indicators
- Retry mechanisms

### Error Types

```typescript
// Validation errors
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Service errors
throw new Error('Failed to create dive plan: ...');

// GPS errors
setError('Location permission not granted');
```

---

## Testing Architecture

### Unit Tests (Planned)

**Core Package:**
- `calculators.ts` - All calculations
- `validators.ts` - All validation rules
- `constants.ts` - Immutability checks

**Example:**
```typescript
describe('calculateMOD', () => {
  it('calculates correct MOD for EAN32', () => {
    expect(calculateMOD(32, 1.4)).toBeCloseTo(33.75, 2);
  });
});
```

### Integration Tests (Planned)

**Service Layer:**
- CRUD operations
- RLS enforcement
- Data transformations

**GPS Tracking:**
- Mock location provider
- Mode switching
- Battery scenarios

### E2E Tests (Planned)

**Critical Paths:**
- Create plan → Start session → Mark entry → End session
- GPS permission flow
- Offline operation

---

## Performance Optimization

### Database

**Strategies:**
- Indexes on query fields
- Batch operations (track points)
- Selective field retrieval
- Connection pooling (Supabase)

**Query Patterns:**
```typescript
// Good: Only needed fields
.select('id, name, max_depth')

// Bad: All fields when not needed
.select('*')
```

### React Native

**Optimizations:**
- FlatList for long lists
- Memoization (useMemo, useCallback)
- Lazy loading
- Image optimization

**Anti-patterns:**
- No inline functions in renders
- No unnecessary re-renders
- No large state objects

### Bundle Size

**Current:** ~2500 modules (expected)

**Optimization:**
- Tree-shaking (automatic)
- Code splitting (planned)
- Dynamic imports (planned)

---

## Deployment

### Expo EAS (Planned)

**Builds:**
- Development: `eas build --profile development`
- Preview: `eas build --profile preview`
- Production: `eas build --profile production`

**OTA Updates:**
- Non-native code updates
- Instant rollout
- Rollback capability

### App Stores

**iOS:**
- TestFlight beta
- App Store review
- Privacy nutrition labels

**Android:**
- Internal testing
- Closed alpha
- Open beta
- Production

---

## Monitoring & Analytics (Planned)

### Error Tracking

**Sentry Integration:**
- Crash reports
- Error grouping
- Release tracking
- Performance monitoring

### Analytics

**Privacy-First:**
- No user tracking
- Aggregate statistics only
- Opt-in telemetry

**Metrics:**
- Dive count (aggregate)
- Feature usage
- Error rates
- Performance (P95, P99)

---

## Future Enhancements

### Technical Debt

- [ ] Implement error boundaries
- [ ] Add comprehensive tests
- [ ] Optimize bundle size
- [ ] Encrypt local storage
- [ ] Background sync
- [ ] Conflict resolution

### Features

- [ ] Offline maps (MapBox)
- [ ] Export to PDF
- [ ] Multi-language
- [ ] Dark mode
- [ ] Accessibility (WCAG)
- [ ] Voice commands (diving gloves)

### Infrastructure

- [ ] CI/CD pipeline
- [ ] Automated testing
- [ ] Performance monitoring
- [ ] A/B testing framework
- [ ] Feature flags

---

## Appendix: Technical Decisions

### Why Expo?

**Pros:**
- Faster development
- OTA updates
- Managed workflow
- Strong community

**Cons:**
- Native module limitations (mitigated with dev-client)
- Bundle size (acceptable for target)

**Decision:** MVP with Expo, bare RN if needed later

### Why Supabase?

**Pros:**
- Postgres (mature, reliable)
- RLS (security)
- Realtime (future)
- Self-hostable

**Cons:**
- Vendor lock-in (mitigated by Postgres)
- Pricing (acceptable for scale)

**Decision:** Best balance of features and safety

### Why Device-Based Auth?

**Pros:**
- Privacy-first
- No password management
- Faster onboarding
- GDPR compliant

**Cons:**
- Device migration complexity
- Multi-device sync (use export/import)

**Decision:** Aligns with privacy goals, acceptable UX

---

**Document Version:** 1.0
**Last Updated:** 2024-01-XX
**Maintained By:** ScuPlan Development Team
