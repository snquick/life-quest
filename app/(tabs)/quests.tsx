import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { CURATED_CATEGORIES, type CuratedQuest } from '@/lib/curated-habits';
import { listPinnedKeys, pinQuest, unpinQuest } from '@/lib/db/habits';

/** Quests screen: the curated catalog, grouped by category, with pin toggles. */
export default function QuestsScreen() {
  const db = useSQLiteContext();
  const [pinnedKeys, setPinnedKeys] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPinnedKeys(new Set(await listPinnedKeys(db)));
    } catch {
      setError("Couldn't load the catalog.");
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleToggle = useCallback(
    async (quest: CuratedQuest, pinned: boolean) => {
      try {
        if (pinned) {
          await unpinQuest(db, quest.curatedKey);
        } else {
          await pinQuest(db, quest);
        }
        await load();
      } catch {
        setError("Couldn't update that pin. Try again.");
      }
    },
    [db, load],
  );

  const sections = useMemo(
    () =>
      CURATED_CATEGORIES.map((category) => ({
        title: category.title,
        data: category.quests,
      })),
    [],
  );

  if (pinnedKeys === null && error === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (pinnedKeys === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void load()}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Text style={styles.retryLabel}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error !== null && <Text style={styles.errorText}>{error}</Text>}
      <SectionList
        sections={sections}
        keyExtractor={(quest) => quest.curatedKey}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const pinned = pinnedKeys.has(item.curatedKey);
          return (
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.points}>{item.points} pts</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={pinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
                accessibilityState={{ selected: pinned }}
                onPress={() => handleToggle(item, pinned)}
                style={({ pressed }) => [
                  styles.pinButton,
                  pinned && styles.pinButtonActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={pinned ? 'pin' : 'pin-outline'}
                  size={18}
                  color={pinned ? '#fff' : '#1e88e5'}
                />
                <Text style={[styles.pinLabel, pinned && styles.pinLabelActive]}>
                  {pinned ? 'Pinned' : 'Pin'}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#666',
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
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
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1e88e5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    backgroundColor: '#fff',
  },
  pinButtonActive: {
    backgroundColor: '#1e88e5',
  },
  pinLabel: {
    color: '#1e88e5',
    fontWeight: '600',
  },
  pinLabelActive: {
    color: '#fff',
  },
  retryButton: {
    backgroundColor: '#1e88e5',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#c62828',
    padding: 16,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
