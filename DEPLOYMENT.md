# 🚀 Production Deployment Guide

This guide covers everything needed to deploy ScuPlan Mobile to production.

## Pre-Deployment Checklist

### 1. Environment Setup ✅

- [ ] Create production Supabase project
- [ ] Run all database migrations in order
- [ ] Configure RLS policies
- [ ] Set up database backups (daily recommended)
- [ ] Get Google Maps API key (Android)
- [ ] Create `.env` with production values

### 2. Security Audit ✅

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review all API keys and secrets
- [ ] Verify RLS policies are working
- [ ] Test device ID hashing
- [ ] Check HTTPS-only communication
- [ ] Review location privacy settings

### 3. Code Quality ✅

```bash
# Run all checks
npm run typecheck
npm run lint
npm test
```

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linter warnings
- [ ] Test coverage > 70%

### 4. App Configuration ✅

Update `app.json`:
- [ ] Set correct `name` and `slug`
- [ ] Update `version` number
- [ ] Set iOS `bundleIdentifier`
- [ ] Set Android `package`
- [ ] Configure permissions
- [ ] Add splash screen and icons

Update `eas.json`:
- [ ] Set correct profile settings
- [ ] Configure auto-increment
- [ ] Set environment variables

## Database Migrations

### Initial Setup

1. **Create Supabase Project:**
```bash
# Via Supabase CLI
supabase init
supabase link --project-ref your-project-ref
```

2. **Run Migrations:**
```bash
cd supabase/migrations
# Apply in order:
psql -f 20251216064608_create_dive_plans_table.sql
psql -f 20251216064615_create_dive_sessions_table.sql
psql -f 20251216064619_create_buddy_system_tables.sql
psql -f 20251216120000_add_set_config_function.sql
```

3. **Verify RLS:**
```sql
-- Test that RLS is working
SELECT * FROM dive_plans; -- Should be empty or only show test data
```

### Backup Strategy

```bash
# Daily automatic backups via Supabase
# Manual backup before major changes
pg_dump -h db.yourproject.supabase.co -U postgres > backup_$(date +%Y%m%d).sql
```

## Building the App

### iOS Build

1. **Configure Apple Developer Account:**
```bash
eas login
eas build:configure
```

2. **Update `eas.json`:**
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "TEAMID123"
      }
    }
  }
}
```

3. **Build:**
```bash
eas build --platform ios --profile production
```

4. **Submit to App Store:**
```bash
eas submit --platform ios --latest
```

### Android Build

1. **Generate Upload Key:**
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore scuplan-upload-key.keystore \
  -alias scuplan-key -keyalg RSA -keysize 2048 -validity 10000
```

2. **Store securely and configure `eas.json`:**
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./play-store-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

3. **Build:**
```bash
eas build --platform android --profile production
```

4. **Submit to Google Play:**
```bash
eas submit --platform android --latest
```

## Environment Variables

### Production `.env`

```env
# Supabase (Production)
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key

# Google Maps (Production)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-prod-google-maps-key

# App Config
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_APP_VERSION=1.0.0

# Optional: Monitoring
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

### Secure Storage

**DO NOT:**
- ❌ Commit `.env` to git
- ❌ Share API keys publicly
- ❌ Use development keys in production

**DO:**
- ✅ Use EAS Secrets for sensitive values
- ✅ Rotate keys regularly
- ✅ Use different keys per environment

```bash
# Store secrets in EAS
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
```

## CI/CD Setup

### GitHub Actions

The repository includes two workflows:

1. **`.github/workflows/ci.yml`** - Runs on every push/PR
   - TypeScript check
   - Linting
   - Tests with coverage
   - Auto-build on main branch

2. **`.github/workflows/security.yml`** - Runs weekly + on main branch
   - npm audit
   - Dependency review

### Required Secrets

Add to GitHub Settings → Secrets:

```
EXPO_TOKEN=your-expo-token
```

Get token: `eas login` then `eas whoami --json`

### Branch Protection

Recommended settings for `main`:
- ✅ Require pull request reviews
- ✅ Require status checks (CI) to pass
- ✅ Require branches to be up to date
- ✅ Require signed commits (optional)

## Monitoring & Analytics

### Sentry (Recommended)

1. **Create Sentry project**
2. **Install SDK:**
```bash
npm install @sentry/react-native
npx @sentry/wizard@latest -i reactNative -p ios android
```

3. **Configure in `app/_layout.tsx`:**
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_APP_ENV,
  enableInExpoDevelopment: false,
  debug: false,
});
```

### Analytics (Optional)

For privacy-first analytics, consider:
- Plausible (GDPR-compliant)
- PostHog (open-source)
- Simple.Analytics

## App Store Listings

### iOS App Store

**Required:**
- App name: ScuPlan - Dive Planning & Safety
- Subtitle: Track dives, find buddies
- Description: (see template below)
- Keywords: diving, scuba, dive log, dive planner
- Screenshots: 6.5" and 5.5" iPhones, 12.9" iPad
- App icon: 1024x1024 PNG
- Privacy policy URL
- Support URL

### Google Play Store

**Required:**
- App name: ScuPlan
- Short description: Plan dives, track sessions, find buddies
- Full description: (see template below)
- Feature graphic: 1024x500
- Screenshots: Phone + Tablet
- App icon: 512x512 PNG
- Privacy policy URL

### Description Template

```
ScuPlan is a dive planning and tracking app for recreational and technical divers.

FEATURES:
• Create multi-gas dive plans (Air, Nitrox, Trimix)
• Track GPS entry/exit points
• Real-time navigation during dives
• Automatic dive log with statistics
• Find nearby dive buddies
• Offline-first design

SAFETY:
ScuPlan is a planning aid. Always follow your dive computer and training.

PRIVACY:
• No account required
• Device-based authentication
• Location used only during active sessions
• GDPR compliant

Perfect for recreational divers, technical divers, and dive instructors.
```

## Post-Deployment

### 1. Smoke Testing

- [ ] Download from store
- [ ] Test registration flow (if added)
- [ ] Create a dive plan
- [ ] Start a session
- [ ] Test GPS tracking
- [ ] Test buddy finder
- [ ] Check offline mode

### 2. Monitoring

- [ ] Set up error monitoring (Sentry)
- [ ] Configure uptime monitoring (Uptime Robot)
- [ ] Set up database alerts (Supabase dashboard)
- [ ] Monitor app store reviews

### 3. User Communication

- [ ] Prepare release notes
- [ ] Update website (if exists)
- [ ] Social media announcement
- [ ] Email beta testers

## Rollout Strategy

### Phased Release (Recommended)

1. **Internal Testing** (1 week)
   - Team members only
   - Critical bug fixes

2. **Closed Beta** (2 weeks)
   - 50-100 trusted testers
   - Gather feedback
   - Performance monitoring

3. **Open Beta** (2 weeks)
   - Public TestFlight (iOS) / Open Testing (Android)
   - Wider feedback
   - Load testing

4. **Production Release**
   - Gradual rollout (10% → 50% → 100%)
   - Monitor crash rates
   - Quick hotfix capability

### Rollback Plan

If critical issues are found:

1. **Immediate:**
   - Pause rollout in store console
   - Notify users via in-app message

2. **Quick Fix:**
   ```bash
   # Fix the issue
   npm version patch
   eas build --platform all --profile production
   eas submit --platform all --latest
   ```

3. **If Urgent:**
   - Roll back database migrations if needed
   - Communicate with active users

## Maintenance

### Regular Tasks

**Daily:**
- Check error monitoring
- Review crash reports
- Monitor database usage

**Weekly:**
- Run security audit
- Check dependency updates
- Review user feedback

**Monthly:**
- Performance analysis
- Cost optimization
- Feature planning

### Updates

**Patch Release (1.0.x):**
- Bug fixes only
- No new features
- Fast approval process

**Minor Release (1.x.0):**
- New features
- UI improvements
- More testing required

**Major Release (x.0.0):**
- Breaking changes
- Database migrations
- User communication required

## Support

### User Support Channels

- GitHub Issues (bugs)
- GitHub Discussions (questions)
- Email: support@scuplan.com
- In-app feedback form (future)

### Response Time SLA

- Critical bugs: 24 hours
- High priority: 3 days
- Medium: 1 week
- Low: 2 weeks

## Cost Estimation

**Monthly Costs (estimated):**
- Supabase Pro: $25/month
- Google Maps API: ~$10/month (low usage)
- EAS Builds: $0 (hobby) or $29/month (professional)
- Sentry: $0 (hobby) or $26/month (team)
- Domain: $12/year
- App Store: $99/year (iOS) + $25 one-time (Android)

**Total:** ~$50-100/month + annual fees

## Legal Requirements

### Privacy Policy

Required for app stores. Must cover:
- Data collection
- Location usage
- Third-party services
- User rights (GDPR)
- Data retention

### Terms of Service

Recommended to include:
- Disclaimer of liability
- User responsibilities
- Acceptable use
- Termination policy

### Compliance

- ✅ GDPR (EU)
- ✅ CCPA (California)
- ✅ App Store guidelines
- ✅ Google Play policies

---

## Quick Reference

```bash
# Build for production
eas build --platform all --profile production

# Submit to stores
eas submit --platform all --latest

# Check build status
eas build:list --limit 5

# View logs
eas build:view <build-id>

# Download build
eas build:download <build-id>
```

---

**Ready to deploy? Follow this checklist top to bottom. Good luck! 🚀**
