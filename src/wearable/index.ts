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
      return new MockWearableBridge();
  }
}

export const wearableBridge: WearableBridge = createBridge(readBridgeKind());

