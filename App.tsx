import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { wearableSDK } from './WearableSDKMock';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState('Idle');
  const [hudMessage, setHudMessage] = useState('Waiting for connection...');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    wearableSDK.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setPhoneStatus('Connected to Glasses');
        setHudMessage('Ready');
      } else {
        setPhoneStatus('Disconnected');
        setHudMessage('Connection Lost');
      }
    });

    wearableSDK.onButtonPress(() => {
      // Step 1: Phone receives the trigger
      setPhoneStatus('Trigger Received! Processing...');
      setIsProcessing(true);
      
      // Step 2: Phone processes event (simulate API call or logic)
      setTimeout(() => {
        setPhoneStatus('Processing complete. Pushing to HUD...');
        
        // Step 3: Phone pushes back visual update to HUD
        wearableSDK.sendHUDUpdate('Action Confirmed ✓').then(() => {
          setHudMessage('Action Confirmed ✓');
          setPhoneStatus('Idle');
          setIsProcessing(false);
          
          // Clear HUD after 3 seconds
          setTimeout(() => {
            if (isConnected) setHudMessage('Ready');
          }, 3000);
        });
      }, 1500); // 1.5s simulated process
    });
  }, [isConnected]);

  const handleConnect = async () => {
    setPhoneStatus('Connecting...');
    setHudMessage('Pairing...');
    await wearableSDK.connect();
  };

  const handleDisconnect = () => {
    wearableSDK.disconnect();
  };

  const handleSimulateHardwareTrigger = () => {
    if (!isConnected || isProcessing) return;
    wearableSDK.simulateHardwareButtonPress();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* PHONE UI SECTION */}
      <View style={styles.phoneSection}>
        <Text style={styles.header}>📱 Mobile App (The Brain)</Text>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Connection Status:</Text>
          <View style={styles.row}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CD964' : '#FF3B30' }]} />
            <Text style={styles.statusValue}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
          </View>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Brain Processing State:</Text>
          <View style={styles.row}>
            <Text style={styles.statusValue}>{phoneStatus}</Text>
            {isProcessing && <ActivityIndicator size="small" color="#0A84FF" style={{ marginLeft: 10 }} />}
          </View>
        </View>

        {!isConnected ? (
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleConnect}>
            <Text style={styles.buttonText}>Connect Smart Glasses</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleDisconnect}>
            <Text style={styles.buttonTextSecondary}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      {/* GLASSES HUD SIMULATOR SECTION */}
      <View style={styles.hudSection}>
        <Text style={styles.header}>🕶️ Smart Glasses HUD</Text>
        <View style={styles.hudDisplay}>
          <Text style={styles.hudText}>{hudMessage}</Text>
        </View>

        <View style={styles.hardwareControls}>
          <Text style={styles.hardwareLabel}>Hardware Simulator</Text>
          <Text style={styles.hardwareSubtext}>Simulates physically pressing the button on your smart glasses.</Text>
          <TouchableOpacity 
            style={[styles.hardwareButton, (!isConnected || isProcessing) && styles.buttonDisabled]} 
            onPress={handleSimulateHardwareTrigger}
            disabled={!isConnected || isProcessing}
          >
            <Text style={styles.buttonText}>PRESS GLASSES BUTTON</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E', // iOS Dark Mode Background
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneSection: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  statusBox: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  statusValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  buttonPrimary: {
    backgroundColor: '#0A84FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    marginHorizontal: 24,
  },
  hudSection: {
    flex: 1.2,
    padding: 24,
    backgroundColor: '#000000', // AMOLED Black to simulate real HUD
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  hudDisplay: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#0a0a0a',
  },
  hudText: {
    color: '#32D74B', // Classic Green Phosphor/HUD Color
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(50, 215, 75, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  hardwareControls: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
  },
  hardwareLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hardwareSubtext: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 16,
  },
  hardwareButton: {
    backgroundColor: '#FF9500',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
