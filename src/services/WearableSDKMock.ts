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

  connect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        if (this.onConnectionChangeCallback) {
          this.onConnectionChangeCallback(true);
        }
        resolve();
      }, 1000);
    });
  }

  disconnect(): void {
    this.isConnected = false;
    if (this.onConnectionChangeCallback) {
      this.onConnectionChangeCallback(false);
    }
  }

  onButtonPress(callback: ButtonPressCallback): void {
    this.onButtonPressCallback = callback;
  }

  onConnectionChange(callback: ConnectionChangeCallback): void {
    this.onConnectionChangeCallback = callback;
  }

  sendHUDUpdate(message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error("Cannot send HUD update: Glasses are not connected."));
        return;
      }
      setTimeout(() => {
        console.log(`[Wearable HUD]: ${message}`);
        resolve();
      }, 500);
    });
  }

  // ==== MOCK HELPER METHODS (For testing without physical hardware) ====
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

export const wearableSDK = new WearableSDKMock();
