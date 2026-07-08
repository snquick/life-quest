import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getPlayer, purchaseUpgrade } from '@/lib/db/player';
import type { Player } from '@/lib/db/schema';
import { nextUpgradePrice } from '@/lib/game/economy';

/** Upgrades screen: spend currency on Level upgrades at a rising price. */
export default function UpgradesScreen() {
  const db = useSQLiteContext();
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPlayer(await getPlayer(db));
    } catch {
      setError("Couldn't load your progress.");
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      setMessage(null);
      void load();
    }, [load]),
  );

  const handleBuy = useCallback(async () => {
    try {
      const updated = await purchaseUpgrade(db);
      setPlayer(updated);
      setMessage(`Level ${updated.level} unlocked!`);
    } catch {
      setMessage(null);
      setError("The purchase didn't go through. Try again.");
    }
  }, [db]);

  if (player === null && error === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (player === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void load()}
          style={({ pressed }) => [styles.buyButton, pressed && styles.pressed]}
        >
          <Text style={styles.buyLabel}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const price = nextUpgradePrice(player.level);
  const affordable = player.currency >= price;

  return (
    <View style={styles.container}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Balance</Text>
        <Text style={styles.statValue}>{player.currency} pts</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Level</Text>
        <Text style={styles.statValue}>{player.level}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Next upgrade</Text>
        <Text style={styles.statValue}>{price} pts</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Buy Level ${player.level + 1} upgrade for ${price} points`}
        accessibilityState={{ disabled: !affordable }}
        disabled={!affordable}
        onPress={handleBuy}
        style={({ pressed }) => [
          styles.buyButton,
          !affordable && styles.buyButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.buyLabel}>Buy upgrade</Text>
      </Pressable>

      {!affordable && (
        <Text style={styles.hint}>Complete habits to earn {price - player.currency} more pts.</Text>
      )}
      {message !== null && <Text style={styles.success}>{message}</Text>}
      {error !== null && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  buyButton: {
    backgroundColor: '#1e88e5',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 48,
    marginTop: 8,
  },
  buyButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  buyLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    color: '#666',
  },
  success: {
    textAlign: 'center',
    color: '#2e7d32',
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    color: '#c62828',
  },
  pressed: {
    opacity: 0.6,
  },
});
