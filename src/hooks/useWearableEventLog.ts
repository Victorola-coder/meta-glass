import { useEffect, useMemo, useState } from 'react';
import { wearableBridge } from '../wearable';
import type { WearableConnectionState, WearableEvent } from '../wearable/WearableBridge';

export type WearableDerivedState = Readonly<{
  bridgeName: string;
  connectionState: WearableConnectionState;
  latestHudMessage: string | null;
  events: readonly WearableEvent[];
}>;

const MAX_EVENTS = 200;

export function useWearableEventLog(): WearableDerivedState {
  const [connectionState, setConnectionState] = useState<WearableConnectionState>(
    wearableBridge.getConnectionState(),
  );
  const [latestHudMessage, setLatestHudMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<WearableEvent[]>([]);

  useEffect(() => {
    const unsubscribe = wearableBridge.onEvent((event) => {
      setEvents((prev) => {
        const next = prev.length >= MAX_EVENTS ? prev.slice(1) : prev;
        return [...next, event];
      });

      if (event.type === 'connection') {
        setConnectionState(event.state);
      }
      if (event.type === 'hud') {
        setLatestHudMessage(event.message);
      }
    });

    return unsubscribe;
  }, []);

  return useMemo(
    () => ({
      bridgeName: wearableBridge.name,
      connectionState,
      latestHudMessage,
      events,
    }),
    [connectionState, latestHudMessage, events],
  );
}

