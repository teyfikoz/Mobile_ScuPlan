import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import Button from '../../../components/Button';
import SafetyDisclaimer from '../../../components/SafetyDisclaimer';
import { createDivePlan } from '../../../services/divePlans';
import { GasMix, UnitSystem } from '../../../packages/core/types';
import { DEFAULT_GAS_MIXES } from '../../../packages/core/constants';
import { calculateMOD } from '../../../packages/core/calculators';

export default function NewPlanScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [locationName, setLocationName] = useState('');
  const [maxDepth, setMaxDepth] = useState('30');
  const [runtime, setRuntime] = useState('45');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [gases, setGases] = useState<GasMix[]>([
    {
      id: crypto.randomUUID(),
      name: DEFAULT_GAS_MIXES.AIR.name,
      o2: DEFAULT_GAS_MIXES.AIR.o2,
      he: DEFAULT_GAS_MIXES.AIR.he,
      maxPo2: 1.4,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a plan name');
      return;
    }

    const depth = parseFloat(maxDepth);
    const runtimeMin = parseInt(runtime);

    if (isNaN(depth) || depth <= 0) {
      Alert.alert('Error', 'Please enter a valid depth');
      return;
    }

    if (isNaN(runtimeMin) || runtimeMin <= 0) {
      Alert.alert('Error', 'Please enter a valid runtime');
      return;
    }

    if (gases.length === 0) {
      Alert.alert('Error', 'At least one gas mix is required');
      return;
    }

    setLoading(true);
    try {
      await createDivePlan({
        schemaVersion: 1,
        name: name.trim(),
        notes: notes.trim() || undefined,
        location: locationName.trim()
          ? { name: locationName.trim() }
          : undefined,
        maxDepth: depth,
        plannedRuntimeMin: runtimeMin,
        unitSystem,
        gases,
      });

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create plan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGas = () => {
    setGases([
      ...gases,
      {
        id: crypto.randomUUID(),
        name: `Gas ${gases.length + 1}`,
        o2: 21,
        he: 0,
        maxPo2: 1.4,
      },
    ]);
  };

  const handleRemoveGas = (id: string) => {
    if (gases.length <= 1) {
      Alert.alert('Error', 'At least one gas mix is required');
      return;
    }
    setGases(gases.filter((g) => g.id !== id));
  };

  const handleUpdateGas = (id: string, updates: Partial<GasMix>) => {
    setGases(gases.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const handleUsePreset = (presetKey: keyof typeof DEFAULT_GAS_MIXES) => {
    const preset = DEFAULT_GAS_MIXES[presetKey];
    setGases([
      {
        id: crypto.randomUUID(),
        name: preset.name,
        o2: preset.o2,
        he: preset.he,
        maxPo2: 1.4,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Dive Plan</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SafetyDisclaimer variant="card" style={styles.disclaimer} />

        <View style={styles.section}>
          <Text style={styles.label}>Plan Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Morning Reef Dive"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="e.g., Blue Hole, Dahab"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Max Depth (m) *</Text>
            <TextInput
              style={styles.input}
              value={maxDepth}
              onChangeText={setMaxDepth}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={colors.text.secondary}
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Runtime (min) *</Text>
            <TextInput
              style={styles.input}
              value={runtime}
              onChangeText={setRuntime}
              keyboardType="numeric"
              placeholder="45"
              placeholderTextColor={colors.text.secondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gas Mixes</Text>
            <TouchableOpacity onPress={handleAddGas}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.presetsContainer}>
            <Text style={styles.presetsLabel}>Quick Presets:</Text>
            <View style={styles.presets}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleUsePreset('AIR')}
              >
                <Text style={styles.presetText}>Air</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleUsePreset('EAN32')}
              >
                <Text style={styles.presetText}>EAN32</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleUsePreset('EAN36')}
              >
                <Text style={styles.presetText}>EAN36</Text>
              </TouchableOpacity>
            </View>
          </View>

          {gases.map((gas, index) => (
            <View key={gas.id} style={styles.gasCard}>
              <View style={styles.gasHeader}>
                <Text style={styles.gasTitle}>Gas {index + 1}</Text>
                {gases.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveGas(gas.id)}>
                    <Trash2 size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.input}
                value={gas.name}
                onChangeText={(value) =>
                  handleUpdateGas(gas.id, { name: value })
                }
                placeholder="Gas name"
                placeholderTextColor={colors.text.secondary}
              />

              <View style={styles.row}>
                <View style={styles.gasInputContainer}>
                  <Text style={styles.gasInputLabel}>O₂ %</Text>
                  <TextInput
                    style={styles.gasInput}
                    value={gas.o2.toString()}
                    onChangeText={(value) =>
                      handleUpdateGas(gas.id, { o2: parseFloat(value) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.gasInputContainer}>
                  <Text style={styles.gasInputLabel}>He %</Text>
                  <TextInput
                    style={styles.gasInput}
                    value={gas.he.toString()}
                    onChangeText={(value) =>
                      handleUpdateGas(gas.id, { he: parseFloat(value) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.gasInputContainer}>
                  <Text style={styles.gasInputLabel}>Max PO₂</Text>
                  <TextInput
                    style={styles.gasInput}
                    value={gas.maxPo2.toString()}
                    onChangeText={(value) =>
                      handleUpdateGas(gas.id, {
                        maxPo2: parseFloat(value) || 1.4,
                      })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.modText}>
                MOD: {calculateMOD(gas.o2, gas.maxPo2).toFixed(1)}m
              </Text>
            </View>
          ))}
        </View>

        <Button
          title="Create Plan"
          onPress={handleSave}
          variant="primary"
          size="large"
          loading={loading}
          style={styles.saveButton}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  disclaimer: {
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  presetsContainer: {
    marginBottom: spacing.md,
  },
  presetsLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    backgroundColor: colors.underwater.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.underwater.cyan,
  },
  presetText: {
    ...typography.bodySmall,
    color: colors.underwater.darkBlue,
    fontWeight: '600',
  },
  gasCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  gasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gasTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  gasInputContainer: {
    flex: 1,
  },
  gasInputLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  gasInput: {
    ...typography.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    textAlign: 'center',
  },
  modText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
