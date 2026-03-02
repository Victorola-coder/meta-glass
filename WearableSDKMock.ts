/**
 * Mock representation of the Meta Wearables Device Access Toolkit / Android XR Jetpack.
 * This class simulates connecting to a smart glass device, receiving hardware 
 * button press events, and pushing data back to the device's Heads-Up Display (HUD).
 */

type ButtonPressCallback = () => void;
type ConnectionChangeCallback = (connected: boolean) => void;

class WearableSDKMock {
  private isConnected: boolean = false;
  private onButtonPressCallback: ButtonPressCallback | null = null;
  private onConnectionChangeCallback: ConnectionChangeCallback | null = null;

  // Simulate connecting to the smart glasses
  connect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        if (this.onConnectionChangeCallback) {
          this.onConnectionChangeCallback(true);
        }
        resolve();
      }, 1000); // 1-second simulated delay for Bluetooth/Wi-Fi connection
    });
  }

  // Simulate disconnecting from the smart glasses
  disconnect(): void {
    this.isConnected = false;
    if (this.onConnectionChangeCallback) {
      this.onConnectionChangeCallback(false);
    }
  }

  // Register a listener for physical hardware button presses on the glasses
  onButtonPress(callback: ButtonPressCallback): void {
    this.onButtonPressCallback = callback;
  }

  // Register a listener for connection state changes
  onConnectionChange(callback: ConnectionChangeCallback): void {
    this.onConnectionChangeCallback = callback;
  }

  // Simulate pushing an update to the user's HUD
  sendHUDUpdate(message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error("Cannot send HUD update: Glasses are not connected."));
        return;
      }
      // Simulate network/Bluetooth latency
      setTimeout(() => {
        console.log(`[Wearable HUD]: ${message}`);
        resolve();
      }, 500);
    });
  }

  // ==== MOCK HELPER METHODS (For testing without physical hardware) ====

  // This method simulates a user physically pressing the button on the glasses.
  // In a real app, this would be triggered by a Bluetooth broadcast receiver.
  simulateHardwareButtonPress(): void {
    if (!this.isConnected) {
      console.warn("Attempted to press button while glasses are disconnected.");
      return;
    }
    if (this.onButtonPressCallback) {
      this.onButtonPressCallback();
    }
  }
}

// Export a singleton instance
export const wearableSDK = new WearableSDKMock();
