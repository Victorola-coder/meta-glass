import type { WearableBridge } from './WearableBridge';
import { MockWearableBridge } from './mock/MockWearableBridge';
import { MetaWearablesBridge } from './meta/MetaWearablesBridge';

type WearableBridgeKind = 'mock' | 'meta-wearables';

function readBridgeKind(): WearableBridgeKind {
  const raw = process.env.EXPO_PUBLIC_WEARABLE_BRIDGE;
  if (raw === 'meta-wearables') return 'meta-wearables';
  return 'mock';
}

function createBridge(kind: WearableBridgeKind): WearableBridge {
  switch (kind) {
    case 'meta-wearables':
      return new MetaWearablesBridge();
    case 'mock':
      return new MockWearableBridge({
        connectMs: Number(process.env.EXPO_PUBLIC_SIM_CONNECT_MS ?? 900),
        hudPushMs: Number(process.env.EXPO_PUBLIC_SIM_HUD_MS ?? 450),
        jitterMs: Number(process.env.EXPO_PUBLIC_SIM_JITTER_MS ?? 140),
        dropRate: Number(process.env.EXPO_PUBLIC_SIM_DROP_RATE ?? 0.07),
      });
  }
}

export const wearableBridge: WearableBridge = createBridge(readBridgeKind());

