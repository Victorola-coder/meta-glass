export type WearableConnectionState = 'disconnected' | 'connecting' | 'connected';

export type WearableTriggerType = 'button' | 'gesture';

export type WearableSimulatorConfig = Readonly<{
  connectMs: number;
  hudPushMs: number;
  jitterMs: number;
  dropRate: number;
}>;

export type WearableSimulatedDevice = Readonly<{
  id: string;
  name: string;
  status: 'connected' | 'inactive';
}>;

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

  simulateTrigger(triggerType: WearableTriggerType): void;

  /** Optional simulator controls (mock bridge only). */
  getSimulatorConfig?(): WearableSimulatorConfig;
  configureSimulator?(patch: Partial<WearableSimulatorConfig>): void;
  listSimulatedDevices?(): readonly WearableSimulatedDevice[];
  getActiveSimulatedDeviceId?(): string | null;
  switchSimulatedDevice?(deviceId: string): Promise<boolean>;

  onEvent(listener: WearableEventListener): WearableUnsubscribe;
}

