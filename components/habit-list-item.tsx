import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Habit } from '@/lib/db/schema';

interface HabitListItemProps {
  habit: Habit;
  /** Called with the habit id when the user taps Complete. */
  onComplete: (habitId: number) => void;
  /** Called with the habit id when the user taps the delete button. */
  onDelete: (habitId: number) => void;
}

/** One habit row: name, point value, a Complete button, and a delete button. */
export function HabitListItem({ habit, onComplete, onDelete }: HabitListItemProps) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={styles.points}>{habit.points} pts</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          habit.completedToday ? `${habit.name} completed today` : `Complete ${habit.name}`
        }
        disabled={habit.completedToday}
        onPress={() => onComplete(habit.id)}
        style={({ pressed }) => [
          styles.completeButton,
          habit.completedToday && styles.completeButtonDone,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={habit.completedToday ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={habit.completedToday ? '#2e7d32' : '#1e88e5'}
        />
        <Text style={[styles.completeLabel, habit.completedToday && styles.completeLabelDone]}>
          {habit.completedToday ? 'Done' : 'Complete'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${habit.name}`}
        onPress={() => onDelete(habit.id)}
        hitSlop={8}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={20} color="#c62828" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  points: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    minHeight: 44,
  },
  completeButtonDone: {
    backgroundColor: '#e8f5e9',
  },
  completeLabel: {
    color: '#1e88e5',
    fontWeight: '600',
  },
  completeLabelDone: {
    color: '#2e7d32',
  },
  deleteButton: {
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
