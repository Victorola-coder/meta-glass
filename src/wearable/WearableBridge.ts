export type WearableConnectionState = 'disconnected' | 'connecting' | 'connected';

export type WearableTriggerType = 'button' | 'gesture';

export type WearableEvent =
  | {
      type: 'connection';
      state: WearableConnectionState;
      atMs: number;
    }
  | {
      type: 'trigger';
      triggerType: WearableTriggerType;
      triggerId: string;
      atMs: number;
    }
  | {
      type: 'hud';
      message: string;
      atMs: number;
    }
  | {
      type: 'error';
      message: string;
      atMs: number;
      context?: Record<string, string>;
    };

export type WearableEventListener = (event: WearableEvent) => void;
export type WearableUnsubscribe = () => void;

export interface WearableBridge {
  readonly name: string;
  getConnectionState(): WearableConnectionState;

  connect(): Promise<void>;
  disconnect(): void;

  sendHudMessage(message: string): Promise<void>;

  /**
   * MOCK ONLY. Emits a trigger event as if it was received from the glasses.
   */
  simulateTrigger(triggerType: WearableTriggerType): void;

  /**
   * Subscribe to all wearable events (connection, triggers, HUD pushes, errors).
   */
  onEvent(listener: WearableEventListener): WearableUnsubscribe;
}

