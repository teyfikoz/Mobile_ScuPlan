# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT Publicly Disclose

Please do not open a public GitHub issue for security vulnerabilities.

### 2. Report Privately

Send an email to: **security@scuplan.com** (or create a private security advisory on GitHub)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Time

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 7 days
- **Fix Timeline:** Depends on severity
  - Critical: 1-3 days
  - High: 7-14 days
  - Medium: 30 days
  - Low: 90 days

## Security Measures

### Application Level

✅ **Authentication & Authorization**
- Device-based authentication (no passwords to leak)
- Row Level Security (RLS) on all Supabase tables
- Hashed device IDs for privacy

✅ **Data Protection**
- HTTPS-only communication
- Grid-based location rounding (~1km precision)
- TTL-based automatic data cleanup
- No sensitive data in client logs

✅ **Input Validation**
- Comprehensive validation layer (`validators.ts`)
- TypeScript strict mode
- SQL injection prevention via parameterized queries

### Infrastructure Level

✅ **Backend (Supabase)**
- PostgreSQL with RLS
- API rate limiting
- Automatic SSL certificates
- Regular security updates

✅ **CI/CD**
- Automated dependency audits (weekly)
- Security scanning on pull requests
- Test coverage enforcement

### Code Quality

✅ **Static Analysis**
- TypeScript strict mode
- ESLint security rules
- Dependency vulnerability scanning

✅ **Testing**
- Unit tests for validators
- Integration tests for services
- Error boundary for crash prevention

## Known Security Considerations

### Location Privacy

**Issue:** GPS coordinates could reveal sensitive locations
**Mitigation:**
- Grid-based rounding (~1km precision)
- Coordinates only shared for buddy matching
- TTL-based automatic cleanup (24 hours)

### Device ID Storage

**Issue:** Device ID used for authentication
**Mitigation:**
- Stored securely in AsyncStorage
- Hashed before sending to server
- Not linkable to personal identity

### Offline Data

**Issue:** Dive plans stored locally on device
**Mitigation:**
- No sensitive personal information
- Device encryption (iOS/Android OS level)
- Optional: Add app-level encryption (future)

## Security Roadmap

### Short Term (Q1 2025)
- [ ] Add certificate pinning
- [ ] Implement biometric authentication
- [ ] Add Sentry for error monitoring
- [ ] Set up penetration testing

### Medium Term (Q2 2025)
- [ ] Add end-to-end encryption for buddy messages
- [ ] Implement secure key storage
- [ ] Add backup/export encryption
- [ ] OWASP compliance audit

### Long Term (Q3-Q4 2025)
- [ ] Third-party security audit
- [ ] Bug bounty program
- [ ] ISO 27001 compliance
- [ ] GDPR full compliance certification

## Security Best Practices for Users

1. **Keep App Updated:** Install updates promptly
2. **Device Security:** Use device PIN/biometric lock
3. **Permission Management:** Only grant necessary permissions
4. **Public WiFi:** Avoid sensitive operations on public networks
5. **Lost Device:** Contact us immediately if device is lost

## Compliance

### GDPR

- Minimal data collection
- No personal identifiable information required
- Right to data deletion (delete profile)
- Data retention policies (TTL-based cleanup)

### Data Stored

**Locally:**
- Device ID (anonymous)
- Dive plans
- Dive sessions
- GPS tracks

**Server:**
- Hashed device IDs
- Rounded GPS coordinates
- Dive metadata (no personal info)

**NOT Stored:**
- Names, emails, phone numbers
- Passwords
- Payment information
- Precise location history

## Third-Party Services

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Supabase | Backend database | Hashed device ID, dive data |
| Google Maps | Map visualization | GPS coordinates (runtime only) |
| Expo | App distribution | Anonymous analytics |

## Security Contacts

- **Security Team:** security@scuplan.com
- **GitHub:** [@teyfikoz](https://github.com/teyfikoz)

---

Last Updated: December 2024
