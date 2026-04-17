import { Colors } from '../theme/colors';
import { StatusBar } from 'expo-status-bar';
import { wearableBridge } from '../wearable';
import type { WearableDerivedState } from '../hooks/useWearableEventLog';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  WearableSimulatedDevice,
  WearableSimulatorConfig,
  WearableTriggerType,
} from '../wearable/WearableBridge';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = { wearableState: WearableDerivedState };

const defaultSimulatorConfig: WearableSimulatorConfig = {
  connectMs: 900,
  hudPushMs: 450,
  jitterMs: 140,
  dropRate: 0.07,
};

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout);
      reject(new Error('aborted'));
    };

    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    if (signal.aborted) {
      onAbort();
      return;
    }

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export default function DashboardScreen({ wearableState }: Props) {
  const { bridgeName, connectionState, latestHudMessage, events } = wearableState;
  const isSimulator = typeof wearableBridge.getSimulatorConfig === 'function';

  const [phoneStatus, setPhoneStatus] = useState<string>('Idle');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [simConfig, setSimConfig] = useState<WearableSimulatorConfig>(
    wearableBridge.getSimulatorConfig?.() ?? defaultSimulatorConfig,
  );
  const [simDevices, setSimDevices] = useState<readonly WearableSimulatedDevice[]>(
    wearableBridge.listSimulatedDevices?.() ?? [],
  );
  const [activeSimDeviceId, setActiveSimDeviceId] = useState<string | null>(
    wearableBridge.getActiveSimulatedDeviceId?.() ?? null,
  );
  const [switchingDeviceId, setSwitchingDeviceId] = useState<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);
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
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    const latestTrigger = [...events].reverse().find((e) => e.type === 'trigger');
    if (!latestTrigger) return;
    if (lastTriggerIdRef.current === latestTrigger.triggerId) return;
    lastTriggerIdRef.current = latestTrigger.triggerId;

    processorAbortRef.current?.abort();
    const abortController = new AbortController();
    processorAbortRef.current = abortController;

    const process = async (triggerType: WearableTriggerType, triggerId: string) => {
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
  }, [events]);

  useEffect(() => {
    return () => {
      processorAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isSimulator) return;
    const tick = setInterval(() => {
      setSimConfig(wearableBridge.getSimulatorConfig?.() ?? defaultSimulatorConfig);
      setSimDevices(wearableBridge.listSimulatedDevices?.() ?? []);
      setActiveSimDeviceId(wearableBridge.getActiveSimulatedDeviceId?.() ?? null);
    }, 600);
    return () => clearInterval(tick);
  }, [isSimulator]);

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

  const updateSimulatorConfig = (patch: Partial<WearableSimulatorConfig>) => {
    wearableBridge.configureSimulator?.(patch);
    setSimConfig(wearableBridge.getSimulatorConfig?.() ?? defaultSimulatorConfig);
  };

  const adjustConnectMs = (delta: number) => {
    updateSimulatorConfig({ connectMs: Math.max(0, simConfig.connectMs + delta) });
  };

  const adjustHudMs = (delta: number) => {
    updateSimulatorConfig({ hudPushMs: Math.max(0, simConfig.hudPushMs + delta) });
  };

  const adjustJitterMs = (delta: number) => {
    updateSimulatorConfig({ jitterMs: Math.max(0, simConfig.jitterMs + delta) });
  };

  const adjustDropRate = (deltaPercent: number) => {
    const next = Math.min(95, Math.max(0, Math.round(simConfig.dropRate * 100) + deltaPercent)) / 100;
    updateSimulatorConfig({ dropRate: next });
  };

  const handleSwitchDevice = async (deviceId: string) => {
    if (!wearableBridge.switchSimulatedDevice) return;
    setSwitchingDeviceId(deviceId);
    const switched = await wearableBridge.switchSimulatedDevice(deviceId);
    if (switched) {
      setActiveSimDeviceId(wearableBridge.getActiveSimulatedDeviceId?.() ?? null);
      setSimDevices(wearableBridge.listSimulatedDevices?.() ?? []);
    }
    setSwitchingDeviceId(null);
  };

  const canTrigger = connectionState === 'connected' && !isProcessing;

  return (
    <View style={styles.container}>
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

        {isSimulator ? (
          <View style={styles.card}>
            <Text style={styles.label}>Simulator Controls</Text>
            <Text style={styles.simulatorHint}>
              Tune connection conditions to test real-time behavior and resilience.
            </Text>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Connect latency</Text>
              <View style={styles.metricControls}>
                <TouchableOpacity style={styles.metricBtn} onPress={() => adjustConnectMs(-100)}>
                  <Text style={styles.metricBtnText}>-100</Text>
                </TouchableOpacity>
                <Text style={styles.metricValue}>{simConfig.connectMs}ms</Text>
                <TouchableOpacity style={styles.metricBtn} onPress={() => adjustConnectMs(100)}>
                  <Text style={styles.metricBtnText}>+100</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>HUD latency</Text>
              <View style={styles.metricControls}>
                <TouchableOpacity style={styles.metricBtn} onPress={() => adjustHudMs(-50)}>
                  <Text style={styles.metricBtnText}>-50</Text>
                </TouchableOpacity>
                <Text style={styles.metricValue}>{simConfig.hudPushMs}ms</Text>
                <TouchableOpacity style={styles.metricBtn} onPress={() => adjustHudMs(50)}>
                  <Text style={styles.metricBtnText}>+50</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Jitter</Text>
              <View style={styles.metricControls}>
                <TouchableOpacity style={styles.metricBtn} onPress={() => adjustJitterMs(-25)}>
                  <Text style={styles.metricBtnText}>-25</Text>
                </TouchableOpacity>
                <Text style={styles.metricValue}>{simConfig.jitterMs}ms</Text>
                <TouchableOpacity style={styles.metricBtn} onPress={() => adjustJitterMs(25)}>
                  <Text style={styles.metricBtnText}>+25</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Drop rate</Text>
              <View style={styles.metricControls}>
                <TouchableOpacity style={styles.metricBtn} onPress={() => adjustDropRate(-5)}>
                  <Text style={styles.metricBtnText}>-5%</Text>
                </TouchableOpacity>
                <Text style={styles.metricValue}>{Math.round(simConfig.dropRate * 100)}%</Text>
                <TouchableOpacity style={styles.metricBtn} onPress={() => adjustDropRate(5)}>
                  <Text style={styles.metricBtnText}>+5%</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.metricLabel, { marginTop: 8, marginBottom: 8 }]}>Simulated devices</Text>
            <View style={styles.deviceChipRow}>
              {simDevices.map((device) => {
                const active = activeSimDeviceId === device.id;
                return (
                  <TouchableOpacity
                    key={device.id}
                    style={[
                      styles.deviceChip,
                      active ? styles.deviceChipActive : undefined,
                    ]}
                    onPress={() => handleSwitchDevice(device.id)}
                    disabled={switchingDeviceId != null}
                  >
                    <Text style={[styles.deviceChipText, active ? styles.deviceChipTextActive : undefined]}>
                      {device.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

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
              <Text style={[styles.btnTextHardware, styles.btnTextHardwareAlt]}>Gesture</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
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
  btnTextHardwareAlt: {
    color: Colors.warning,
  },
  btnDisabled: {
    opacity: 0.4,
  },
});

