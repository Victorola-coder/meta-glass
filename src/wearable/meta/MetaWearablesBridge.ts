import type {
  WearableBridge,
  WearableConnectionState,
  WearableEvent,
  WearableEventListener,
  WearableTriggerType,
  WearableUnsubscribe,
} from '../WearableBridge';

function nowMs(): number {
  return Date.now();
}

export class MetaWearablesBridge implements WearableBridge {
  public readonly name = 'meta-wearables';
  private connectionState: WearableConnectionState = 'disconnected';
  private readonly listeners = new Set<WearableEventListener>();

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
    this.emit({
      type: 'error',
      message: 'Meta bridge not wired yet. Use mock or plug in the real SDK.',
      atMs: nowMs(),
      context: { bridge: this.name },
    });
    throw new Error('Not implemented.');
  }

  public disconnect(): void {
    this.connectionState = 'disconnected';
    this.emit({ type: 'connection', state: 'disconnected', atMs: nowMs() });
  }

  public async sendHudMessage(_message: string): Promise<void> {
    this.emit({
      type: 'error',
      message: 'HUD not wired.',
      atMs: nowMs(),
      context: { bridge: this.name },
    });
    throw new Error('Not implemented.');
  }

  public simulateTrigger(triggerType: WearableTriggerType): void {
    this.emit({
      type: 'error',
      message: 'Simulate is mock-only.',
      atMs: nowMs(),
      context: { bridge: this.name, triggerType },
    });
  }

  private emit(event: WearableEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

