# ScuPlan Mobile

**A professional-grade dive planning and tracking companion for recreational and technical scuba divers.**

ScuPlan Mobile is a safety-critical application that enables divers to plan dives, track GPS entry/exit points, monitor dive runtime, find dive buddies, and review dive logs - all with offline-first capability and battery optimization.

---

## Features

### Core Features (MVP)

✅ **Dive Plan Management**
- Create and manage multiple dive plans
- Multi-gas mix support (Air, Nitrox, Trimix)
- MOD (Maximum Operating Depth) calculations
- Location tracking
- QR code and deep link import/export
- Offline storage

✅ **Dive Session Tracking**
- GPS entry and exit point marking
- Real-time location tracking with adaptive sampling
- Route polyline visualization
- Distance and bearing calculations
- Session statistics (duration, max distance, track length)
- Underwater mode with reduced GPS sampling

✅ **GPS & Navigation**
- High/Low/Underwater GPS modes
- Background location tracking (session-only)
- Map visualization with entry/exit markers
- Compass bearing to entry point
- Offline map support

✅ **Dive Log**
- Automatic session logging
- Statistics and route replay
- Export capabilities (planned)

✅ **Safety & Privacy**
- Prominent safety disclaimers
- GDPR/KVKK compliant
- Device-based authentication (no accounts)
- Local-first data storage

### Buddy Finder (Database Ready)
- Privacy-first discovery
- Location grid rounding (~1km precision)
- Certification level display
- TTL-based session expiration
- Contact request system

---

## Architecture

### Technology Stack

**Mobile App:**
- Expo SDK (React Native)
- TypeScript
- React Navigation (Tabs + Stack)
- expo-location (GPS tracking)
- react-native-maps (Map visualization)
- expo-barcode-scanner (QR import/export)

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions (ready)
- Device-based authentication

**Data Storage:**
- AsyncStorage (local preferences)
- Supabase Postgres (sync)
- Offline-first with sync capability

### Project Structure

```
scuplan-mobile/
├── app/                        # Expo Router pages
│   ├── (tabs)/                 # Tab navigation
│   │   ├── index.tsx           # Home screen
│   │   ├── plans/              # Dive plans stack
│   │   ├── buddy.tsx           # Buddy finder
│   │   ├── log.tsx             # Dive log
│   │   └── more.tsx            # Settings & About
│   ├── session.tsx             # Active dive session (modal)
│   └── _layout.tsx             # Root layout
├── packages/
│   └── core/                   # Core business logic
│       ├── types.ts            # TypeScript definitions
│       ├── validators.ts       # Data validation
│       ├── calculators.ts      # Dive calculations
│       └── constants.ts        # App constants
├── services/                   # Data services
│   ├── divePlans.ts            # Dive plan CRUD
│   └── diveSessions.ts         # Session tracking
├── hooks/                      # React hooks
│   ├── useLocation.ts          # GPS tracking
│   └── useFrameworkReady.ts    # Framework init
├── components/                 # Reusable components
│   ├── Button.tsx
│   └── SafetyDisclaimer.tsx
├── constants/
│   └── theme.ts                # Design system
└── lib/
    ├── supabase.ts             # Supabase client
    └── storage.ts              # AsyncStorage utils
```

### Database Schema

**dive_plans**
- Stores dive plans with multi-gas support
- Device-scoped with RLS
- Schema versioning for migrations

**dive_sessions**
- Active and completed dive sessions
- Entry/exit GPS points
- Session statistics

**track_points**
- GPS tracking points
- Linked to sessions
- Sequence-based ordering

**buddy_profiles** (Ready for Phase 2)
- Privacy-first buddy discovery
- Grid-rounded locations
- TTL-based expiration

**contact_requests** (Ready for Phase 2)
- Buddy contact requests
- Auto-expiring sessions

### Data Models

All data models include:
- Schema versioning (`schemaVersion: 1`)
- Validation via `packages/core/validators.ts`
- Type safety via TypeScript

**Key Types:**
- `DivePlan` - Dive plan with gases, depth, runtime
- `GasMix` - Gas mix (O2, He, maxPO2)
- `DiveSession` - Active/completed session with GPS
- `GeoPoint` - GPS coordinate with timestamp
- `BuddyProfile` - Buddy finder profile

---

## GPS & Battery Optimization

### GPS Modes

1. **High Accuracy** (Surface, Active Planning)
   - 5s interval, high accuracy
   - Entry/exit marking

2. **Low Accuracy** (Surface, Battery Saving)
   - 30s interval, balanced accuracy
   - Background tracking

3. **Underwater Mode** (Manual Toggle)
   - 5min interval or paused
   - Battery preservation

### Battery Strategy
- No GPS when app is closed (session-only)
- Adaptive sampling based on mode
- Background task unregister on session end
- Min distance threshold (10m)

---

## Safety & Compliance

### Safety Features

**Disclaimers:**
- Onboarding screen
- Plan creation
- Session start
- Settings/About

**Standard Text:**
> "ScuPlan is a planning and logging aid. Always follow your dive computer and training."

### Privacy & GDPR

**Device-Based Authentication:**
- No user accounts required
- Device ID stored locally
- Hashed for backend (buddy system)

**Data Handling:**
- Local-first storage
- Explicit location consent
- No continuous background tracking
- Buddy data TTL (24h auto-delete)

**RLS Policies:**
- Device can only access own data
- Buddy profiles visible within radius
- Contact requests scoped to sender/receiver

---

## Calculations & Safety

### Implemented Calculations

**Gas Mix Calculations:**
- MOD (Maximum Operating Depth)
- EAD (Equivalent Air Depth)
- Gas validation (O2 + He ≤ 100%)

**Navigation:**
- Haversine distance (GPS points)
- Bearing calculation
- Track distance accumulation

**Units:**
- Metric (meters, liters)
- Imperial (feet, cubic feet)
- Conversion utilities

---

## Development

### Prerequisites

```bash
node >= 18
npm >= 9
expo-cli
```

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Running

```bash
# Web (development)
npm run dev

# Type checking
npm run typecheck

# Build for web
npm run build:web
```

### Supabase Setup

1. Create a Supabase project
2. Run migrations (already applied)
3. Configure RLS policies
4. Get project URL and anon key

---

## Roadmap

### MVP ✅ (Current)
- [x] Dive plan CRUD
- [x] GPS session tracking
- [x] Map visualization
- [x] Dive log
- [x] Safety disclaimers
- [x] Offline-first architecture
- [x] Database schema with RLS

### Phase 2 (Next)
- [ ] Buddy finder UI
- [ ] QR code scanning
- [ ] Deep link handling
- [ ] Export to PDF
- [ ] Share functionality
- [ ] Onboarding flow
- [ ] Consent management

### Phase 3 (Future)
- [ ] Apple Watch integration (native SwiftUI)
- [ ] Garmin Connect IQ support
- [ ] Wear OS support
- [ ] Background sync optimization
- [ ] Offline maps
- [ ] Multi-language support

### Advanced Features (Long-term)
- [ ] Dive computer integrations
- [ ] Emergency surface signaling
- [ ] Instructor mode (group tracking)
- [ ] Advanced decompression planning
- [ ] Gas consumption tracking

---

## Smartwatch Integration

### Architecture Plan

**Apple Watch (Native SwiftUI):**
- Separate target in same repo
- WatchConnectivity framework
- Independent operation during dive
- Sync on surface

**MVP Watch Features:**
- Runtime timer
- Entry/exit marking
- Simple heading arrow
- Haptic reminders

**Phase 2:**
- Depth display (if available)
- Safety stop alerts
- Gas switch reminders

**NOT in scope:**
- Decompression calculations (use dive computer)
- Heavy UI (safety-critical simplicity)
- Continuous sync (battery preservation)

---

## Testing & Quality

### Testing Strategy

**Unit Tests:**
- Core calculators
- Validators
- Data transformations

**Integration Tests:**
- Service layer
- Database operations
- GPS tracking

**Safety Tests:**
- Edge cases (no GPS, no permission)
- Battery scenarios
- Crash recovery

### Quality Checklist

- [x] TypeScript strict mode
- [x] Schema versioning
- [x] Error boundaries (planned)
- [x] Offline capability
- [x] RLS security
- [ ] E2E tests
- [ ] Beta testing program

---

## Contributing

This is a safety-critical application. All contributions must:
1. Maintain data integrity
2. Follow security best practices
3. Include tests
4. Update documentation
5. Preserve offline-first architecture

---

## License

MIT

---

## Disclaimer

**ScuPlan Mobile is a planning and logging aid. It is NOT a dive computer.**

- Always follow your dive computer and training
- Never rely solely on a mobile app for dive safety
- Consult with certified dive professionals
- Follow all local diving regulations
- This app is for informational purposes only

**By using this app, you acknowledge that scuba diving is an inherently risky activity and you assume all risks.**

---

## Support

For questions, issues, or feature requests:
- GitHub Issues (planned)
- Email: support@scuplan.com (planned)
- Documentation: docs.scuplan.com (planned)

---

**Stay safe. Dive responsibly. 🌊**
