import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HabitListItem } from '@/components/habit-list-item';
import { POINTS_MAX, POINTS_MIN } from '@/lib/constants';
import { completeHabit, createHabit, deleteHabit, listHabits } from '@/lib/db/habits';
import { getPlayer } from '@/lib/db/player';
import type { Habit } from '@/lib/db/schema';

/** Habits screen: add, complete, and delete habits; shows the currency balance. */
export default function HabitsScreen() {
  const db = useSQLiteContext();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [currency, setCurrency] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pointsText, setPointsText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [habitRows, player] = await Promise.all([listHabits(db), getPlayer(db)]);
      setHabits(habitRows);
      setCurrency(player.currency);
    } catch {
      setError("Couldn't load your habits.");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleAdd = useCallback(async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setFormError('Enter a habit name.');
      return;
    }
    const points = Number(pointsText);
    if (!Number.isInteger(points) || points < POINTS_MIN || points > POINTS_MAX) {
      setFormError(`Points must be a whole number from ${POINTS_MIN} to ${POINTS_MAX}.`);
      return;
    }
    try {
      setFormError(null);
      await createHabit(db, trimmed, points);
      setName('');
      setPointsText('');
      await load();
    } catch {
      setFormError("Couldn't add that habit. Try again.");
    }
  }, [db, name, pointsText, load]);

  const handleComplete = useCallback(
    async (habitId: number) => {
      try {
        await completeHabit(db, habitId);
        await load();
      } catch {
        setError("That completion didn't save. Try again.");
      }
    },
    [db, load],
  );

  const handleDelete = useCallback(
    async (habitId: number) => {
      try {
        await deleteHabit(db, habitId);
        await load();
      } catch {
        setError("Couldn't delete that habit. Try again.");
      }
    },
    [db, load],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceValue}>{currency} pts</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.nameInput}
          placeholder="New habit name"
          value={name}
          onChangeText={setName}
          accessibilityLabel="Habit name"
          maxLength={60}
        />
        <TextInput
          style={styles.pointsInput}
          placeholder={`${POINTS_MIN}-${POINTS_MAX}`}
          value={pointsText}
          onChangeText={setPointsText}
          keyboardType="number-pad"
          accessibilityLabel={`Points, ${POINTS_MIN} to ${POINTS_MAX}`}
          maxLength={2}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add habit"
          onPress={handleAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>
      {formError !== null && <Text style={styles.errorText}>{formError}</Text>}

      {error !== null ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setLoading(true);
              void load();
            }}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.addLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : habits.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No habits yet. Add one to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(habit) => String(habit.id)}
          renderItem={({ item }) => (
            <HabitListItem habit={item} onComplete={handleComplete} onDelete={handleDelete} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff8e1',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#795548',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5d4037',
  },
  form: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  pointsInput: {
    width: 64,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#1e88e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    minHeight: 44,
  },
  addLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#1e88e5',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorText: {
    color: '#c62828',
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 16,
  },
  pressed: {
    opacity: 0.6,
  },
});
