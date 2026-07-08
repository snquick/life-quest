import { StyleSheet, Text, View } from 'react-native';

/** Habits screen, a placeholder until the habit list is built. */
export default function HabitsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habits</Text>
      <Text>Your habits will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
});
