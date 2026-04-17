# Smart Glasses Proxy Trigger App

Mobile app (React Native / Expo, TypeScript) that acts as the "brain" for smart glasses: when a button or gesture fires on the glasses, the phone gets the event, does some work, and pushes a visual back to the glasses HUD.

No physical hardware yet—the app uses a mock bridge that pretends to be the glasses (connect, trigger, HUD). Swap in the real Meta / Android XR SDK later by implementing the same bridge interface.

## Run

```bash
npm install
npm start
```

Then `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go.

## What’s in the app

- **Dashboard**: connect to "glasses", see status and processing state, fire Button or Gesture. The HUD strip shows whatever the phone pushes (e.g. "Confirmed: button ✓").
- **Event log**: list of connection, trigger, HUD, and error events with timestamps.

Bridge interface lives in `src/wearable/WearableBridge.ts`. Default is the mock; set `EXPO_PUBLIC_WEARABLE_BRIDGE=meta-wearables` to use the (unimplemented) Meta stub.

## Simulator mode (recommended for QA)

The mock bridge now exposes live simulator controls in the Dashboard:

- connect latency
- HUD push latency
- jitter
- packet drop rate
- device switching (2 simulated glasses)
- one-tap presets: `Realtime`, `Normal`, `Poor Network`, `Chaos`

You can also preconfigure simulator startup values via env vars:

- `EXPO_PUBLIC_SIM_CONNECT_MS` (default `900`)
- `EXPO_PUBLIC_SIM_HUD_MS` (default `450`)
- `EXPO_PUBLIC_SIM_JITTER_MS` (default `140`)
- `EXPO_PUBLIC_SIM_DROP_RATE` (default `0.07`, range `0-1`)

## Proof of work

Put screenshots or a short video in `docs/proof/` (e.g. `demo.gif`, `01-dashboard.png`, …) and link them from here. Show: connect → tap Button/Gesture → phone shows processing → HUD shows confirmation → Event log shows the events.
