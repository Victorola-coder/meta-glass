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
    // Intentionally a stub: wiring this requires a native module + vendor SDK,
    // which is not included in this POC repo.
    this.emit({
      type: 'error',
      message:
        'MetaWearablesBridge is not wired. Use the mock bridge or add a native module binding to the Meta Wearables Device Access Toolkit.',
      atMs: nowMs(),
      context: { bridge: this.name },
    });
    throw new Error('MetaWearablesBridge is not implemented in this POC.');
  }

  public disconnect(): void {
    this.connectionState = 'disconnected';
    this.emit({ type: 'connection', state: 'disconnected', atMs: nowMs() });
  }

  public async sendHudMessage(_message: string): Promise<void> {
    this.emit({
      type: 'error',
      message:
        'sendHudMessage is not wired. Add vendor SDK display primitives here.',
      atMs: nowMs(),
      context: { bridge: this.name },
    });
    throw new Error('MetaWearablesBridge is not implemented in this POC.');
  }

  public simulateTrigger(triggerType: WearableTriggerType): void {
    const event: WearableEvent = {
      type: 'error',
      message: 'simulateTrigger is mock-only and not available on MetaWearablesBridge.',
      atMs: nowMs(),
      context: { bridge: this.name, triggerType },
    };
    this.emit(event);
  }

  private emit(event: WearableEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

