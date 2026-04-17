import type {
  WearableBridge,
  WearableConnectionState,
  WearableEvent,
  WearableEventListener,
  WearableSimulatedDevice,
  WearableSimulatorConfig,
  WearableTriggerType,
  WearableUnsubscribe,
} from '../WearableBridge';

function nowMs(): number {
  return Date.now();
}

function createTriggerId(triggerType: WearableTriggerType): string {
  return `${triggerType}-${nowMs()}-${Math.random().toString(16).slice(2)}`;
}

export class MockWearableBridge implements WearableBridge {
  public readonly name = 'mock';

  private connectionState: WearableConnectionState = 'disconnected';
  private readonly listeners = new Set<WearableEventListener>();
  private simulatorConfig: WearableSimulatorConfig;
  private simulatedDevices: WearableSimulatedDevice[];
  private activeDeviceId: string | null;
  private connectAttempt = 0;

  public constructor(config: Partial<WearableSimulatorConfig> = {}) {
    this.simulatorConfig = {
      connectMs: config.connectMs ?? 900,
      hudPushMs: config.hudPushMs ?? 450,
      jitterMs: config.jitterMs ?? 140,
      dropRate: config.dropRate ?? 0.07,
    };
    this.simulatedDevices = [
      { id: 'mock-1', name: 'TalkSign Mock Glasses A', status: 'connected' },
      { id: 'mock-2', name: 'TalkSign Mock Glasses B', status: 'inactive' },
    ];
    this.activeDeviceId = this.simulatedDevices[0]?.id ?? null;
  }

  public getConnectionState(): WearableConnectionState {
    return this.connectionState;
  }

  public onEvent(listener: WearableEventListener): WearableUnsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async connect(): Promise<void> {
    if (this.connectionState === 'connected') return;
    if (this.connectionState === 'connecting') return;

    this.setConnectionState('connecting');
    const attempt = ++this.connectAttempt;
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), this.nextDelayMs(this.simulatorConfig.connectMs));
    });
    if (attempt !== this.connectAttempt) return;
    if (this.shouldDrop()) {
      this.setConnectionState('disconnected');
      this.emit({
        type: 'error',
        message: 'Simulated connection drop. Retry connect.',
        atMs: nowMs(),
        context: { bridge: this.name },
      });
      return;
    }
    this.setConnectionState('connected');
  }

  public disconnect(): void {
    this.connectAttempt += 1;
    this.setConnectionState('disconnected');
  }

  public async sendHudMessage(message: string): Promise<void> {
    if (this.connectionState !== 'connected') {
      this.emit({
        type: 'error',
        message: 'Glasses not connected.',
        atMs: nowMs(),
        context: { bridge: this.name },
      });
      throw new Error('Glasses not connected.');
    }

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), this.nextDelayMs(this.simulatorConfig.hudPushMs));
    });
    if (this.shouldDrop()) {
      this.emit({
        type: 'error',
        message: 'Simulated HUD push timeout.',
        atMs: nowMs(),
        context: { bridge: this.name },
      });
      throw new Error('Simulated HUD timeout');
    }
    this.emit({ type: 'hud', message, atMs: nowMs() });
  }

  public simulateTrigger(triggerType: WearableTriggerType): void {
    if (this.connectionState !== 'connected') {
      this.emit({
        type: 'error',
        message: 'Glasses not connected.',
        atMs: nowMs(),
        context: { triggerType },
      });
      return;
    }
    if (this.shouldDrop()) {
      this.emit({
        type: 'error',
        message: `Simulated ${triggerType} trigger packet drop.`,
        atMs: nowMs(),
        context: { bridge: this.name, triggerType },
      });
      return;
    }

    const event: WearableEvent = {
      type: 'trigger',
      triggerType,
      triggerId: createTriggerId(triggerType),
      atMs: nowMs(),
    };
    this.emit(event);
  }

  public getSimulatorConfig(): WearableSimulatorConfig {
    return this.simulatorConfig;
  }

  public configureSimulator(patch: Partial<WearableSimulatorConfig>): void {
    this.simulatorConfig = {
      ...this.simulatorConfig,
      ...patch,
      connectMs: this.clampInt(patch.connectMs ?? this.simulatorConfig.connectMs, 0, 5000),
      hudPushMs: this.clampInt(patch.hudPushMs ?? this.simulatorConfig.hudPushMs, 0, 4000),
      jitterMs: this.clampInt(patch.jitterMs ?? this.simulatorConfig.jitterMs, 0, 2000),
      dropRate: this.clampFloat(patch.dropRate ?? this.simulatorConfig.dropRate, 0, 0.95),
    };
    this.emit({
      type: 'hud',
      message: `Simulator updated: connect=${this.simulatorConfig.connectMs}ms hud=${this.simulatorConfig.hudPushMs}ms jitter=${this.simulatorConfig.jitterMs}ms drop=${Math.round(this.simulatorConfig.dropRate * 100)}%`,
      atMs: nowMs(),
    });
  }

  public listSimulatedDevices(): readonly WearableSimulatedDevice[] {
    return this.simulatedDevices;
  }

  public getActiveSimulatedDeviceId(): string | null {
    return this.activeDeviceId;
  }

  public async switchSimulatedDevice(deviceId: string): Promise<boolean> {
    if (!this.simulatedDevices.some((device) => device.id === deviceId)) {
      return false;
    }
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), this.nextDelayMs(Math.max(120, this.simulatorConfig.connectMs / 2)));
    });
    if (this.shouldDrop()) {
      this.emit({
        type: 'error',
        message: 'Simulated device switch timeout.',
        atMs: nowMs(),
      });
      return false;
    }
    this.activeDeviceId = deviceId;
    this.simulatedDevices = this.simulatedDevices.map((device) => ({
      ...device,
      status: device.id === deviceId ? 'connected' : 'inactive',
    }));
    const active = this.simulatedDevices.find((device) => device.id === deviceId);
    this.emit({
      type: 'hud',
      message: `Active device: ${active?.name ?? deviceId}`,
      atMs: nowMs(),
    });
    return true;
  }

  private setConnectionState(state: WearableConnectionState): void {
    if (this.connectionState === state) return;
    this.connectionState = state;
    this.emit({ type: 'connection', state, atMs: nowMs() });
  }

  private emit(event: WearableEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private nextDelayMs(base: number): number {
    const jitter = this.simulatorConfig.jitterMs;
    if (jitter <= 0) return Math.max(0, Math.round(base));
    const offset = (Math.random() * jitter * 2) - jitter;
    return Math.max(0, Math.round(base + offset));
  }

  private shouldDrop(): boolean {
    return Math.random() < this.simulatorConfig.dropRate;
  }

  private clampInt(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  private clampFloat(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
