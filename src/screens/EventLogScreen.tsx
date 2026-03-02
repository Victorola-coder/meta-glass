import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useWearableEventLog } from '../hooks/useWearableEventLog';
import { Colors } from '../theme/colors';
import type { WearableEvent } from '../wearable/WearableBridge';

function formatTime(ms: number): string {
  const d = new Date(ms);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function titleForEvent(event: WearableEvent): string {
  switch (event.type) {
    case 'connection':
      return `Connection → ${event.state}`;
    case 'trigger':
      return `Trigger (${event.triggerType})`;
    case 'hud':
      return 'HUD Push';
    case 'error':
      return 'Error';
  }
}

function detailForEvent(event: WearableEvent): string {
  switch (event.type) {
    case 'connection':
      return 'Wearable bridge connection state changed.';
    case 'trigger':
      return `id=${event.triggerId}`;
    case 'hud':
      return event.message;
    case 'error':
      return event.message;
  }
}

export default function EventLogScreen() {
  const { bridgeName, events } = useWearableEventLog();
  const data = useMemo(() => [...events].reverse(), [events]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Event Log</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{bridgeName}</Text>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => `${item.type}-${item.atMs}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isError = item.type === 'error';
          return (
            <View style={[styles.row, isError && styles.rowError]}>
              <Text style={styles.time}>{formatTime(item.atMs)}</Text>
              <View style={styles.textCol}>
                <Text style={styles.title}>{titleForEvent(item)}</Text>
                <Text style={styles.detail} numberOfLines={2}>
                  {detailForEvent(item)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyDetail}>Connect the glasses and fire a trigger to see the proxy flow.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  badge: {
    borderWidth: 1,
    borderColor: Colors.surfaceHighlight,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  row: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceHighlight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
  },
  rowError: {
    borderColor: Colors.danger,
  },
  time: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    width: 64,
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  detail: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    paddingTop: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  emptyDetail: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
});

