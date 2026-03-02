import { Colors } from '../theme/colors';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { wearableSDK } from '../services/WearableSDKMock';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';

export default function MainScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState('Idle');
  const [hudMessage, setHudMessage] = useState('Waiting for connection...');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    switch (connectionState) {
      case 'connected':
        setPhoneStatus('Connected to Glasses');
        break;
      case 'connecting':
        setPhoneStatus('Connecting...');
        break;
      case 'disconnected':
        setPhoneStatus('Disconnected');
        break;
    }
  }, [connectionState]);

  useEffect(() => {
    if (events.length === 0) return;
    const lastEvent = events[events.length - 1];
    
    if (lastEvent.type === 'trigger' && lastEvent.triggerType === 'button') {
      setPhoneStatus('Trigger Received! Processing...');
      setIsProcessing(true);
      
      setTimeout(() => {
        setPhoneStatus('Processing complete. Pushing to HUD...');
        
        wearableBridge.sendHudMessage('Action Confirmed ✓').then(() => {
          setPhoneStatus('Idle');
          setIsProcessing(false);
        }).catch((err) => {
           setPhoneStatus('Failed to update HUD.');
           setIsProcessing(false);
           console.error(err);
        });
      }, 1500);
    }
  }, [events]);

  const handleConnect = async () => {
    await wearableBridge.connect();
  };

  const handleDisconnect = () => {
    wearableBridge.disconnect();
  };

  const handleSimulateHardwareTrigger = () => {
    if (!isConnected || isProcessing) return;
    wearableBridge.simulateTrigger('button');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.background} />
      
      {/* PHONE UI SECTION */}
      <View style={styles.sectionContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.emojiIcon}>📱</Text>
          <Text style={styles.headerTitle}>Phone Brain</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Connection Status</Text>
          <View style={styles.row}>
            <View style={[styles.statusIndicator, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
            <Text style={styles.value}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Processing State</Text>
          <View style={styles.row}>
            <Text style={[styles.value, { flex: 1 }]} numberOfLines={1}>{phoneStatus}</Text>
            {isProcessing && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />}
          </View>
        </View>

        {!isConnected ? (
          <TouchableOpacity style={[styles.button, styles.btnPrimary]} onPress={handleConnect}>
            <Text style={styles.btnTextPrimary}>Connect glasses via Bluetooth</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.btnSecondary]} onPress={handleDisconnect}>
            <Text style={styles.btnTextSecondary}>Disconnect Glasses</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* GLASSES HUD SIMULATOR SECTION */}
      <View style={[styles.sectionContainer, styles.hudContainer]}>
        <View style={styles.headerContainer}>
          <Text style={styles.emojiIcon}>🕶️</Text>
          <Text style={styles.headerTitle}>Glasses HUD Simulator</Text>
        </View>

        <View style={styles.hudScreen}>
          <Text style={styles.hudText}>{latestHudMessage || (isConnected ? 'Ready' : 'Waiting for connection...')}</Text>
        </View>

        <View style={styles.glassHardwareCard}>
          <View style={styles.hardwareTextGroup}>
            <Text style={styles.hardwareTitle}>Hardware Trigger Simulator</Text>
            <Text style={styles.hardwareDescription}>
              Press to mock pressing the physical button on the right arm of the smart glasses.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, styles.btnHardware, (!isConnected || isProcessing) && styles.btnDisabled]} 
            onPress={handleSimulateHardwareTrigger}
            disabled={!isConnected || isProcessing}
            activeOpacity={0.7}
          >
            <Text style={styles.btnTextHardware}>PRESS PHYSICAL BUTTON</Text>
          </TouchableOpacity>
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
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  emojiIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
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
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  value: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
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
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
    fontWeight: '700',
  },
  btnTextSecondary: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  hudContainer: {
    backgroundColor: '#050B14', // Slightly darker than background for contrast
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
    marginBottom: 20,
    shadowColor: Colors.hudText,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  hudText: {
    color: Colors.hudText,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(50, 215, 75, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: 1,
  },
  glassHardwareCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceHighlight,
  },
  hardwareTextGroup: {
    marginBottom: 16,
  },
  hardwareTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  hardwareDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  btnHardware: {
    backgroundColor: Colors.warning,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnTextHardware: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
