import { StyleSheet, Text, View } from 'react-native';

/** Upgrades screen, a placeholder until the Level upgrade shop is built. */
export default function UpgradesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upgrades</Text>
      <Text>The Level upgrade shop will appear here.</Text>
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
