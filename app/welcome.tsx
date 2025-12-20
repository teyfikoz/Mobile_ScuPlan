import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Check, X, Shield, Users, Map, TrendingUp, Mail } from 'lucide-react-native';
import { colors, spacing, typography } from '../constants/theme';
import Button from '../components/Button';
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
  recordConsent,
  completeOnboarding,
} from '../services/auth';

const CONSENT_VERSION = '1.0';

const GDPR_TEXT = `
GDPR (General Data Protection Regulation) Consent

By accepting this consent, you agree that:

• We will collect and process your personal data (name, email, location) for providing dive planning and buddy finder services
• Your dive logs and statistics will be stored securely in our database
• You can request to access, modify, or delete your data at any time
• Your location data will only be shared with other users if you explicitly enable location sharing
• We use encryption to protect your data both in transit and at rest
• Your data will not be sold to third parties
• You can withdraw this consent at any time from settings

Your Rights:
- Right to access your data
- Right to rectification
- Right to erasure (right to be forgotten)
- Right to restrict processing
- Right to data portability
- Right to object

For more information, please see our Privacy Policy.
`;

const KVKK_TEXT = `
KVKK (Kişisel Verilerin Korunması Kanunu) Onayı

Bu onayı kabul ederek şunları onaylarsınız:

• Kişisel verilerinizin (ad, e-posta, konum) dalış planlama ve buddy bulma hizmetleri için toplanacağını ve işleneceğini
• Dalış kayıtlarınızın ve istatistiklerinizin veritabanımızda güvenli bir şekilde saklanacağını
• Verilerinize erişim, düzeltme veya silme talebinde bulunabileceğinizi
• Konum verilerinizin yalnızca konum paylaşımını açıkça etkinleştirmeniz durumunda diğer kullanıcılarla paylaşılacağını
• Verilerinizi hem aktarım sırasında hem de depolama sırasında korumak için şifreleme kullandığımızı
• Verilerinizin üçüncü taraflara satılmayacağını
• Bu onayı istediğiniz zaman ayarlardan geri çekebileceğinizi

Haklarınız:
- Verilerinize erişim hakkı
- Düzeltme hakkı
- Silme hakkı (unutulma hakkı)
- İşlemeyi kısıtlama hakkı
- Veri taşınabilirliği hakkı
- İtiraz hakkı

Daha fazla bilgi için lütfen Gizlilik Politikamıza bakın.
`;

const TERMS_TEXT = `
Terms of Service

By using ScuPlan, you agree to:

1. Use the app responsibly and follow all diving safety guidelines
2. Provide accurate information in your profile
3. Not use the app for any illegal or harmful activities
4. Respect other users' privacy and safety
5. Understand that dive planning is your own responsibility
6. Not hold ScuPlan liable for any diving accidents or incidents
7. Follow all local diving laws and regulations
8. Be certified for the dives you plan to undertake

Safety Notice:
- This app is a tool to assist with dive planning, not a substitute for proper training
- Always dive within your certification limits
- Always use appropriate safety equipment
- Never dive alone unless properly trained for solo diving
- Check weather and sea conditions before diving
- Have appropriate insurance coverage

We reserve the right to:
- Suspend or terminate accounts that violate these terms
- Update these terms at any time (you will be notified)
- Remove content that violates our community guidelines
`;

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showGdprText, setShowGdprText] = useState(false);
  const [showKvkkText, setShowKvkkText] = useState(false);
  const [showTermsText, setShowTermsText] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSignIn = async () => {
    // Check if all required consents are given
    if (!gdprAccepted || !kvkkAccepted || !termsAccepted) {
      Alert.alert(
        'Consent Required',
        'Please accept GDPR, KVKK, and Terms of Service to continue.'
      );
      return;
    }

    // Validate email and password
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await signInWithEmail(email.trim(), password);

      if (!user) {
        throw new Error('Failed to create user profile');
      }

      // Record consents
      await Promise.all([
        recordConsent(user.id, {
          type: 'GDPR',
          version: CONSENT_VERSION,
          text: GDPR_TEXT,
          granted: true,
        }),
        recordConsent(user.id, {
          type: 'KVKK',
          version: CONSENT_VERSION,
          text: KVKK_TEXT,
          granted: true,
        }),
        recordConsent(user.id, {
          type: 'TERMS',
          version: CONSENT_VERSION,
          text: TERMS_TEXT,
          granted: true,
        }),
        recordConsent(user.id, {
          type: 'MARKETING',
          version: CONSENT_VERSION,
          text: 'Marketing communications consent',
          granted: marketingConsent,
        }),
      ]);

      // Mark onboarding as complete
      await completeOnboarding();

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert('Sign In Failed', error.message || 'Please try again or contact support if the problem persists.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (provider: 'google' | 'apple') => {
    // Check if all required consents are given
    if (!gdprAccepted || !kvkkAccepted || !termsAccepted) {
      Alert.alert(
        'Consent Required',
        'Please accept GDPR, KVKK, and Terms of Service to continue.'
      );
      return;
    }

    setLoading(true);
    try {
      const signInFunc = provider === 'google' ? signInWithGoogle : signInWithApple;
      const { user, isNewUser } = await signInFunc();

      if (!user) {
        throw new Error('Failed to create user profile');
      }

      // Record consents
      await Promise.all([
        recordConsent(user.id, {
          type: 'GDPR',
          version: CONSENT_VERSION,
          text: GDPR_TEXT,
          granted: true,
        }),
        recordConsent(user.id, {
          type: 'KVKK',
          version: CONSENT_VERSION,
          text: KVKK_TEXT,
          granted: true,
        }),
        recordConsent(user.id, {
          type: 'TERMS',
          version: CONSENT_VERSION,
          text: TERMS_TEXT,
          granted: true,
        }),
        recordConsent(user.id, {
          type: 'MARKETING',
          version: CONSENT_VERSION,
          text: 'Marketing communications consent',
          granted: marketingConsent,
        }),
      ]);

      // Mark onboarding as complete
      await completeOnboarding();

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert('Sign In Failed', error.message || 'Please try again or contact support if the problem persists.');
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.logoPlaceholder}>
        <Shield size={64} color={colors.primary} />
      </View>
      <Text style={styles.title}>Welcome to ScuPlan</Text>
      <Text style={styles.subtitle}>
        Your complete dive planning and buddy finding companion
      </Text>

      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Map size={32} color={colors.primary} />
          <Text style={styles.featureTitle}>Dive Planning</Text>
          <Text style={styles.featureText}>
            Plan dives with GPS tracking, gas calculations, and safety features
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Users size={32} color={colors.primary} />
          <Text style={styles.featureTitle}>Find Buddies</Text>
          <Text style={styles.featureText}>
            Connect with divers and instructors near you
          </Text>
        </View>

        <View style={styles.featureItem}>
          <TrendingUp size={32} color={colors.primary} />
          <Text style={styles.featureTitle}>Track Progress</Text>
          <Text style={styles.featureText}>
            Log dives and track your diving statistics
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Shield size={32} color={colors.primary} />
          <Text style={styles.featureTitle}>Privacy First</Text>
          <Text style={styles.featureText}>
            Your data is encrypted and you control what you share
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.testButton}
        onPress={() => setCurrentStep(1)}
      >
        <Text style={styles.testButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConsentStep = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Privacy & Consent</Text>
      <Text style={styles.subtitle}>
        We take your privacy seriously. Please review and accept the following:
      </Text>

      {/* GDPR Consent */}
      <View style={styles.consentBox}>
        <TouchableOpacity
          style={styles.consentHeader}
          onPress={() => setShowGdprText(!showGdprText)}
        >
          <View style={styles.consentHeaderLeft}>
            <TouchableOpacity
              style={[styles.checkbox, gdprAccepted && styles.checkboxChecked]}
              onPress={() => setGdprAccepted(!gdprAccepted)}
            >
              {gdprAccepted && <Check size={16} color={colors.white} />}
            </TouchableOpacity>
            <View>
              <Text style={styles.consentTitle}>GDPR Consent *</Text>
              <Text style={styles.consentSubtitle}>European data protection</Text>
            </View>
          </View>
          <Text style={styles.expandText}>{showGdprText ? 'Hide' : 'Read'}</Text>
        </TouchableOpacity>

        {showGdprText && (
          <ScrollView style={styles.consentTextScroll} nestedScrollEnabled>
            <Text style={styles.consentText}>{GDPR_TEXT}</Text>
          </ScrollView>
        )}
      </View>

      {/* KVKK Consent */}
      <View style={styles.consentBox}>
        <TouchableOpacity
          style={styles.consentHeader}
          onPress={() => setShowKvkkText(!showKvkkText)}
        >
          <View style={styles.consentHeaderLeft}>
            <TouchableOpacity
              style={[styles.checkbox, kvkkAccepted && styles.checkboxChecked]}
              onPress={() => setKvkkAccepted(!kvkkAccepted)}
            >
              {kvkkAccepted && <Check size={16} color={colors.white} />}
            </TouchableOpacity>
            <View>
              <Text style={styles.consentTitle}>KVKK Consent *</Text>
              <Text style={styles.consentSubtitle}>Turkish data protection</Text>
            </View>
          </View>
          <Text style={styles.expandText}>{showKvkkText ? 'Hide' : 'Read'}</Text>
        </TouchableOpacity>

        {showKvkkText && (
          <ScrollView style={styles.consentTextScroll} nestedScrollEnabled>
            <Text style={styles.consentText}>{KVKK_TEXT}</Text>
          </ScrollView>
        )}
      </View>

      {/* Terms of Service */}
      <View style={styles.consentBox}>
        <TouchableOpacity
          style={styles.consentHeader}
          onPress={() => setShowTermsText(!showTermsText)}
        >
          <View style={styles.consentHeaderLeft}>
            <TouchableOpacity
              style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              {termsAccepted && <Check size={16} color={colors.white} />}
            </TouchableOpacity>
            <View>
              <Text style={styles.consentTitle}>Terms of Service *</Text>
              <Text style={styles.consentSubtitle}>Usage terms and safety notice</Text>
            </View>
          </View>
          <Text style={styles.expandText}>{showTermsText ? 'Hide' : 'Read'}</Text>
        </TouchableOpacity>

        {showTermsText && (
          <ScrollView style={styles.consentTextScroll} nestedScrollEnabled>
            <Text style={styles.consentText}>{TERMS_TEXT}</Text>
          </ScrollView>
        )}
      </View>

      {/* Marketing Consent (Optional) */}
      <View style={styles.consentBox}>
        <TouchableOpacity
          style={styles.consentHeader}
          onPress={() => setMarketingConsent(!marketingConsent)}
        >
          <View style={styles.consentHeaderLeft}>
            <TouchableOpacity
              style={[styles.checkbox, marketingConsent && styles.checkboxChecked]}
              onPress={() => setMarketingConsent(!marketingConsent)}
            >
              {marketingConsent && <Check size={16} color={colors.white} />}
            </TouchableOpacity>
            <View>
              <Text style={styles.consentTitle}>Marketing Communications</Text>
              <Text style={styles.consentSubtitle}>Optional: Receive news and updates</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.requiredNote}>* Required to use the app</Text>

      <Button
        title="Continue"
        onPress={() => setCurrentStep(2)}
        variant="primary"
        size="large"
        disabled={!gdprAccepted || !kvkkAccepted || !termsAccepted}
      />

      <TouchableOpacity onPress={() => setCurrentStep(0)} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSignInStep = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>
        Enter your email and password to continue
      </Text>

      {/* Email & Password Sign In */}
      <View style={styles.emailSignInContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.text.secondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          placeholderTextColor={colors.text.secondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!loading}
        />

        <Button
          title={loading ? 'Signing in...' : 'Sign In / Sign Up'}
          onPress={handleEmailSignIn}
          variant="primary"
          size="large"
          disabled={loading}
        />

        <Text style={styles.helpText}>
          First time? We'll create your account automatically!
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* OAuth Options */}
      <View style={styles.signInButtonsContainer}>
        <TouchableOpacity
          style={[styles.signInButton, styles.googleButton]}
          onPress={() => handleSignIn('google')}
          disabled={loading}
        >
          <Text style={styles.signInButtonText}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signInButton, styles.appleButton]}
          onPress={() => handleSignIn('apple')}
          disabled={loading}
        >
          <Text style={[styles.signInButtonText, styles.appleButtonText]}>
            Continue with Apple
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.privacyNote}>
        <Shield size={20} color={colors.text.secondary} />
        <Text style={styles.privacyNoteText}>
          Your data is encrypted and secure. We never share your information with third parties.
        </Text>
      </View>

      <TouchableOpacity onPress={() => setCurrentStep(1)} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <ScrollView style={styles.container}>
      {currentStep === 0 && renderWelcomeStep()}
      {currentStep === 1 && renderConsentStep()}
      {currentStep === 2 && renderSignInStep()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepContainer: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 60,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featuresContainer: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  featureTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  consentBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  consentTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  consentSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  expandText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  consentTextScroll: {
    maxHeight: 200,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  consentText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  requiredNote: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  signInButtonsContainer: {
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  signInButton: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  appleButton: {
    backgroundColor: '#000',
  },
  signInButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  appleButtonText: {
    color: '#fff',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  privacyNoteText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  backButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    padding: spacing.md,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  emailSignInContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  helpText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  testButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
