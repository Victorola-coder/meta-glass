import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useWearableEventLog } from '../hooks/useWearableEventLog';
import { Colors } from '../theme/colors';
import DashboardScreen from './DashboardScreen';
import EventLogScreen from './EventLogScreen';

type Tab = 'dashboard' | 'log';

export default function MainScreen() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const wearableState = useWearableEventLog();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'dashboard' && styles.tabActive]}
          onPress={() => setTab('dashboard')}
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, tab === 'dashboard' && styles.tabTextActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'log' && styles.tabActive]}
          onPress={() => setTab('log')}
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, tab === 'log' && styles.tabTextActive]}>Event log</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {tab === 'dashboard' ? (
          <DashboardScreen wearableState={wearableState} />
        ) : (
          <EventLogScreen wearableState={wearableState} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.surfaceHighlight,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
});
