import type {
  WearableBridge,
  WearableConnectionState,
  WearableEvent,
  WearableEventListener,
  WearableTriggerType,
  WearableUnsubscribe,
} from '../WearableBridge';

type MockTimingsMs = Readonly<{
  connectMs: number;
  hudPushMs: number;
}>;

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
  private readonly timings: MockTimingsMs;

  public constructor(timings: Partial<MockTimingsMs> = {}) {
    this.timings = {
      connectMs: timings.connectMs ?? 900,
      hudPushMs: timings.hudPushMs ?? 450,
    };
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
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), this.timings.connectMs);
    });
    this.setConnectionState('connected');
  }

  public disconnect(): void {
    this.setConnectionState('disconnected');
  }

  public async sendHudMessage(message: string): Promise<void> {
    if (this.connectionState !== 'connected') {
      this.emit({
        type: 'error',
        message: 'Cannot push HUD message: glasses not connected.',
        atMs: nowMs(),
        context: { bridge: this.name },
      });
      throw new Error('Glasses are not connected.');
    }

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), this.timings.hudPushMs);
    });

    // In a real SDK this would be a device display primitive; for the mock it is
    // an event that the HUD panel can listen to.
    this.emit({ type: 'hud', message, atMs: nowMs() });
  }

  public simulateTrigger(triggerType: WearableTriggerType): void {
    if (this.connectionState !== 'connected') {
      this.emit({
        type: 'error',
        message: 'Trigger ignored: glasses not connected.',
        atMs: nowMs(),
        context: { triggerType },
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
}

