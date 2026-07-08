import { StyleSheet, Text, View } from 'react-native';

/** Quests screen, a placeholder until the curated catalog is built. */
export default function QuestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quests</Text>
      <Text>The curated quest catalog will appear here.</Text>
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
