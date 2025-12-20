import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

export default function BuddyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buddy Finder</Text>
      <Text style={styles.text}>Find diving buddies near you</Text>
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
  text: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});
