import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <Text style={styles.subtitle}>Welcome to ScuPlan!</Text>
      <Text style={styles.text}>If you can see this, the tab navigation is working.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  text: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
});
