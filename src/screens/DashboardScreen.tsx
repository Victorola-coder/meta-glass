import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useWearableEventLog } from '../hooks/useWearableEventLog';
import { Colors } from '../theme/colors';
import { wearableBridge } from '../wearable';
import type { WearableTriggerType } from '../wearable/WearableBridge';

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => resolve(), ms);
    const onAbort = () => {
      clearTimeout(timeout);
      reject(new Error('aborted'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export default function DashboardScreen() {
  const { bridgeName, connectionState, latestHudMessage, events } = useWearableEventLog();

  const [phoneStatus, setPhoneStatus] = useState<string>('Idle');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const lastTriggerIdRef = useRef<string | null>(null);
  const processorAbortRef = useRef<AbortController | null>(null);

  const hudText = useMemo(() => {
    if (connectionState === 'connecting') return 'Pairing...';
    if (connectionState !== 'connected') return 'Waiting for connection...';
    return latestHudMessage ?? 'Ready';
  }, [connectionState, latestHudMessage]);

  useEffect(() => {
    if (connectionState === 'connected') {
      setPhoneStatus('Connected to Glasses');
      return;
    }
    if (connectionState === 'connecting') {
      setPhoneStatus('Connecting...');
      return;
    }
    setPhoneStatus('Disconnected');
  }, [connectionState]);

  useEffect(() => {
    const latestTrigger = [...events].reverse().find((e) => e.type === 'trigger');
    if (!latestTrigger) return;
    if (lastTriggerIdRef.current === latestTrigger.triggerId) return;
    lastTriggerIdRef.current = latestTrigger.triggerId;

    // Cancel any in-flight processing. Real apps might queue instead; for a POC
    // we keep it deterministic.
    processorAbortRef.current?.abort();
    const abortController = new AbortController();
    processorAbortRef.current = abortController;

    const process = async (triggerType: WearableTriggerType, triggerId: string) => {
      if (isProcessing) return;
      setIsProcessing(true);
      try {
        setPhoneStatus(`Trigger received (${triggerType}). Processing...`);
        await sleep(1200, abortController.signal);

        setPhoneStatus('Pushing visual confirmation to HUD...');
        await wearableBridge.sendHudMessage(`Confirmed: ${triggerType} ✓`);

        setPhoneStatus(`Processed trigger ${triggerId.slice(0, 10)}…`);
        await sleep(600, abortController.signal);
        setPhoneStatus('Idle');
      } catch (err) {
        if (abortController.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setPhoneStatus(`Error: ${message}`);
      } finally {
        if (!abortController.signal.aborted) setIsProcessing(false);
      }
    };

    void process(latestTrigger.triggerType, latestTrigger.triggerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  useEffect(() => {
    return () => {
      processorAbortRef.current?.abort();
    };
  }, []);

  const handleConnect = async () => {
    try {
      await wearableBridge.connect();
    } catch {
      // Error is already emitted via bridge event stream; keep UI stable here.
    }
  };

  const handleDisconnect = () => {
    wearableBridge.disconnect();
  };

  const handleSimulateTrigger = (triggerType: WearableTriggerType) => {
    wearableBridge.simulateTrigger(triggerType);
  };

  const canTrigger = connectionState === 'connected' && !isProcessing;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.background} />

      {/* PHONE UI SECTION */}
      <View style={styles.sectionContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Phone Brain</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{bridgeName}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Connection Status</Text>
          <View style={styles.row}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    connectionState === 'connected'
                      ? Colors.success
                      : connectionState === 'connecting'
                        ? Colors.warning
                        : Colors.danger,
                },
              ]}
            />
            <Text style={styles.value}>{connectionState}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Processing State</Text>
          <View style={styles.row}>
            <Text style={[styles.value, { flex: 1 }]} numberOfLines={1}>
              {phoneStatus}
            </Text>
            {isProcessing && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />}
          </View>
        </View>

        {connectionState !== 'connected' ? (
          <TouchableOpacity style={[styles.button, styles.btnPrimary]} onPress={handleConnect}>
            <Text style={styles.btnTextPrimary}>Connect glasses</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.btnSecondary]} onPress={handleDisconnect}>
            <Text style={styles.btnTextSecondary}>Disconnect glasses</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* GLASSES HUD SIMULATOR SECTION */}
      <View style={[styles.sectionContainer, styles.hudContainer]}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Glasses HUD Simulator</Text>
        </View>

        <View style={styles.hudScreen}>
          <Text style={styles.hudText}>{hudText}</Text>
        </View>

        <View style={styles.glassHardwareCard}>
          <Text style={styles.hardwareTitle}>Proxy Trigger</Text>
          <Text style={styles.hardwareDescription}>
            Simulate a glasses event. The trigger is emitted by the wearable bridge, processed by the phone, then
            acknowledged back onto the HUD via a HUD message push.
          </Text>

          <View style={styles.triggerRow}>
            <TouchableOpacity
              style={[styles.button, styles.btnHardware, !canTrigger && styles.btnDisabled]}
              onPress={() => handleSimulateTrigger('button')}
              disabled={!canTrigger}
              activeOpacity={0.7}
            >
              <Text style={styles.btnTextHardware}>Button</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.btnHardwareAlt, !canTrigger && styles.btnDisabled]}
              onPress={() => handleSimulateTrigger('gesture')}
              disabled={!canTrigger}
              activeOpacity={0.7}
            >
              <Text style={styles.btnTextHardware}>Gesture</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.2,
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
  card: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceHighlight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  value: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  btnTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  btnTextSecondary: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
  hudContainer: {
    backgroundColor: '#050B14',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceHighlight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  hudScreen: {
    flex: 1,
    backgroundColor: Colors.hudBackground,
    borderWidth: 2,
    borderColor: Colors.surfaceHighlight,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.hudText,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  hudText: {
    color: Colors.hudText,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(50, 215, 75, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: 0.8,
  },
  glassHardwareCard: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceHighlight,
  },
  hardwareTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  hardwareDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  triggerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnHardware: {
    backgroundColor: Colors.warning,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnHardwareAlt: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  btnTextHardware: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.4,
  },
});

