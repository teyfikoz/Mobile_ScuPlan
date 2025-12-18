import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, MapPin, Droplet, Thermometer, Eye, Wind } from 'lucide-react-native';
import { colors, spacing, typography } from '../constants/theme';
import Button from '../components/Button';
import {
  createDiveHistory,
  getNextDiveNumber,
  CreateDiveHistoryData,
} from '../services/diveHistory';
import { getCurrentUserProfile } from '../services/auth';
import { DIVING_LOCATIONS } from '../packages/core/buddyConstants';

export default function DiveLogEntryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [diveNumber, setDiveNumber] = useState(1);

  // Basic Info
  const [diveDate, setDiveDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [diveSiteName, setDiveSiteName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  // Dive Details
  const [maxDepth, setMaxDepth] = useState('');
  const [duration, setDuration] = useState('');
  const [waterTemp, setWaterTemp] = useState('');
  const [visibility, setVisibility] = useState('');
  const [gasMix, setGasMix] = useState('Air');

  // Tank Info
  const [tankVolume, setTankVolume] = useState('');
  const [startPressure, setStartPressure] = useState('');
  const [endPressure, setEndPressure] = useState('');

  // Conditions
  const [weatherConditions, setWeatherConditions] = useState('');
  const [seaState, setSeaState] = useState('');
  const [currentStrength, setCurrentStrength] = useState('');

  // Other
  const [buddyNames, setBuddyNames] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [notes, setNotes] = useState('');
  const [highlights, setHighlights] = useState('');
  const [wildlifeSpotted, setWildlifeSpotted] = useState('');

  // Ratings
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [enjoymentRating, setEnjoymentRating] = useState(5);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        return;
      }

      setUserId(profile.id);

      const nextNumber = await getNextDiveNumber(profile.id);
      setDiveNumber(nextNumber);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!diveSiteName.trim()) {
      Alert.alert('Validation Error', 'Dive site name is required');
      return;
    }

    if (!maxDepth || parseFloat(maxDepth) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid max depth');
      return;
    }

    if (!duration || parseInt(duration) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid duration');
      return;
    }

    setLoading(true);
    try {
      const data: CreateDiveHistoryData = {
        userId,
        diveNumber,
        diveDate: diveDate.getTime(),
        diveSiteName: diveSiteName.trim(),
        diveSiteCountry: country || undefined,
        diveSiteCity: city || undefined,
        maxDepthMeters: parseFloat(maxDepth),
        durationMinutes: parseInt(duration),
        waterTemperatureCelsius: waterTemp ? parseFloat(waterTemp) : undefined,
        visibilityMeters: visibility ? parseFloat(visibility) : undefined,
        gasMix: gasMix || undefined,
        tankVolumeLiters: tankVolume ? parseFloat(tankVolume) : undefined,
        startingPressureBar: startPressure ? parseFloat(startPressure) : undefined,
        endingPressureBar: endPressure ? parseFloat(endPressure) : undefined,
        weatherConditions: weatherConditions.trim() || undefined,
        seaState: seaState.trim() || undefined,
        currentStrength: currentStrength.trim() || undefined,
        buddyNames: buddyNames.trim() ? buddyNames.split(',').map((s) => s.trim()) : undefined,
        instructorName: instructorName.trim() || undefined,
        notes: notes.trim() || undefined,
        highlights: highlights.trim() ? highlights.split(',').map((s) => s.trim()) : undefined,
        wildlifeSpotted: wildlifeSpotted.trim() ? wildlifeSpotted.split(',').map((s) => s.trim()) : undefined,
        difficultyRating,
        enjoymentRating,
      };

      await createDiveHistory(data);

      Alert.alert('Success', 'Dive log saved successfully!', [
        {
          text: 'Add Another',
          onPress: () => {
            resetForm();
            setDiveNumber(diveNumber + 1);
          },
        },
        {
          text: 'View Log',
          onPress: () => router.push('/(tabs)/log'),
        },
      ]);
    } catch (error) {
      console.error('Failed to save dive log:', error);
      Alert.alert('Error', 'Failed to save dive log');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDiveDate(new Date());
    setDiveSiteName('');
    setCountry('');
    setCity('');
    setMaxDepth('');
    setDuration('');
    setWaterTemp('');
    setVisibility('');
    setGasMix('Air');
    setTankVolume('');
    setStartPressure('');
    setEndPressure('');
    setWeatherConditions('');
    setSeaState('');
    setCurrentStrength('');
    setBuddyNames('');
    setInstructorName('');
    setNotes('');
    setHighlights('');
    setWildlifeSpotted('');
    setDifficultyRating(3);
    setEnjoymentRating(5);
  };

  const renderRatingStars = (rating: number, setRating: (r: number) => void) => {
    return (
      <View style={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={styles.star}>{star <= rating ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Dive Log #{diveNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={colors.text.secondary} />
            <Text style={styles.dateText}>{diveDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={diveDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDiveDate(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Dive Site Name *</Text>
          <TextInput
            style={styles.input}
            value={diveSiteName}
            onChangeText={setDiveSiteName}
            placeholder="Blue Hole, Great Barrier Reef, etc."
            maxLength={100}
          />

          <Text style={styles.label}>Country</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {DIVING_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.countryCode}
                style={[styles.chip, country === loc.countryCode && styles.chipActive]}
                onPress={() => {
                  setCountry(loc.countryCode);
                  setCity(loc.cities[0]);
                }}
              >
                <Text style={styles.chipText}>
                  {loc.flag} {loc.country}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {country && (
            <>
              <Text style={styles.label}>City</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {DIVING_LOCATIONS.find((l) => l.countryCode === country)?.cities.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, city === c && styles.chipActive]}
                    onPress={() => setCity(c)}
                  >
                    <Text style={styles.chipText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Dive Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dive Details</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Max Depth (m) *</Text>
              <TextInput
                style={styles.input}
                value={maxDepth}
                onChangeText={setMaxDepth}
                placeholder="18"
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Duration (min) *</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="45"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Water Temp (°C)</Text>
              <TextInput
                style={styles.input}
                value={waterTemp}
                onChangeText={setWaterTemp}
                placeholder="24"
                keyboardType="decimal-pad"
                maxLength={4}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Visibility (m)</Text>
              <TextInput
                style={styles.input}
                value={visibility}
                onChangeText={setVisibility}
                placeholder="20"
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
          </View>

          <Text style={styles.label}>Gas Mix</Text>
          <View style={styles.gasOptions}>
            {['Air', 'Nitrox 32', 'Nitrox 36', 'Trimix'].map((gas) => (
              <TouchableOpacity
                key={gas}
                style={[styles.chip, gasMix === gas && styles.chipActive]}
                onPress={() => setGasMix(gas)}
              >
                <Text style={styles.chipText}>{gas}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tank Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tank Information</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Tank Volume (L)</Text>
              <TextInput
                style={styles.input}
                value={tankVolume}
                onChangeText={setTankVolume}
                placeholder="12"
                keyboardType="decimal-pad"
                maxLength={4}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Start (bar)</Text>
              <TextInput
                style={styles.input}
                value={startPressure}
                onChangeText={setStartPressure}
                placeholder="200"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>End (bar)</Text>
              <TextInput
                style={styles.input}
                value={endPressure}
                onChangeText={setEndPressure}
                placeholder="50"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>
        </View>

        {/* Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions</Text>

          <Text style={styles.label}>Weather</Text>
          <TextInput
            style={styles.input}
            value={weatherConditions}
            onChangeText={setWeatherConditions}
            placeholder="Sunny, cloudy, rainy, etc."
            maxLength={50}
          />

          <Text style={styles.label}>Sea State</Text>
          <View style={styles.gasOptions}>
            {['Calm', 'Moderate', 'Rough'].map((state) => (
              <TouchableOpacity
                key={state}
                style={[styles.chip, seaState === state && styles.chipActive]}
                onPress={() => setSeaState(state)}
              >
                <Text style={styles.chipText}>{state}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Current</Text>
          <View style={styles.gasOptions}>
            {['None', 'Mild', 'Moderate', 'Strong'].map((current) => (
              <TouchableOpacity
                key={current}
                style={[styles.chip, currentStrength === current && styles.chipActive]}
                onPress={() => setCurrentStrength(current)}
              >
                <Text style={styles.chipText}>{current}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Other Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Details</Text>

          <Text style={styles.label}>Buddy Names (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={buddyNames}
            onChangeText={setBuddyNames}
            placeholder="John, Sarah, Mike"
            maxLength={200}
          />

          <Text style={styles.label}>Instructor Name</Text>
          <TextInput
            style={styles.input}
            value={instructorName}
            onChangeText={setInstructorName}
            placeholder="Instructor name"
            maxLength={100}
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes about this dive..."
            multiline
            numberOfLines={4}
            maxLength={1000}
          />

          <Text style={styles.label}>Highlights (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={highlights}
            onChangeText={setHighlights}
            placeholder="Saw sharks, beautiful coral, found anchor"
            maxLength={200}
          />

          <Text style={styles.label}>Wildlife Spotted (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={wildlifeSpotted}
            onChangeText={setWildlifeSpotted}
            placeholder="Sharks, turtles, octopus, rays"
            maxLength={200}
          />
        </View>

        {/* Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ratings</Text>

          <Text style={styles.label}>Difficulty</Text>
          {renderRatingStars(difficultyRating, setDifficultyRating)}

          <Text style={styles.label}>Enjoyment</Text>
          {renderRatingStars(enjoymentRating, setEnjoymentRating)}
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button title="Save Dive Log" onPress={handleSave} loading={loading} variant="primary" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  dateText: {
    ...typography.body,
    color: colors.text.primary,
  },
  horizontalScroll: {
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.body,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  gasOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  star: {
    fontSize: 32,
    color: colors.warning,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
});
