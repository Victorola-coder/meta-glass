# Smart Glasses Proxy Trigger App

This repository contains a proof-of-concept mobile application built with React Native (Expo) and TypeScript. It serves as the "brain" for a smart glasses integration, demonstrating a Proxy Trigger flow end-to-end.

## The Goal

When a physical button or trigger is pressed on the smart glasses, the signal must push to the smartphone. The smartphone then processes the event and sends a visual update back to the glasses' HUD (Heads-Up Display).

Because physical wearable hardware (requiring the Meta Wearables Device Access Toolkit or Android XR Jetpack) is currently being provisioned, this repository ships with a **Wearable Bridge mock** that behaves like a real SDK:

- emits trigger events (button / gesture)
- simulates connect + HUD push latency
- pushes HUD messages back to a “Glasses HUD Simulator” view

## Features

- **Phone Brain UI**: connection state + processing pipeline state
- **Glasses HUD Simulator**: shows what would be rendered on-glasses
- **Proxy Trigger simulators**: “button” and “gesture” triggers
- **Event Log page**: timestamped bridge events (connection / trigger / HUD / errors)

## Architecture

The app mimics the communication flow:

1. **Trigger**: a trigger event is emitted by the wearable bridge (mocking a glasses hardware button press or gesture)
2. **Receive**: the phone subscribes to the bridge event stream (`WearableBridge.onEvent`)
3. **Process**: the phone runs a short processing pipeline (simulated delay)
4. **Acknowledge**: the phone pushes a HUD message back through the bridge (`sendHudMessage`)
5. **Render**: the “Glasses HUD Simulator” updates only via HUD push events (no direct UI mutation)

Key interface: `src/wearable/WearableBridge.ts`

## 💻 Tech Stack

- React Native (Expo)
- TypeScript

## Configuration

This POC selects a bridge implementation via environment variable:

- `EXPO_PUBLIC_WEARABLE_BRIDGE=mock` (default)
- `EXPO_PUBLIC_WEARABLE_BRIDGE=meta-wearables` (stub that intentionally errors until you wire the real SDK)

The stub entry point is `src/wearable/meta/MetaWearablesBridge.ts`. In a real integration, you would bind the vendor SDK into React Native via a native module and emit the same `WearableEvent` stream back to JS.

## How to Run Locally

You will need Node.js and npm installed.

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd proxy-trigger-app

# Install dependencies
npm install

# Start the Expo development server
npm start
```

Press `i` in the terminal to open the iOS simulator, `a` for the Android emulator, or `w` to run it in a web browser. Alternatively, scan the QR code with the Expo Go app on your physical smartphone.

## Proof of Work

Add your submission artifacts under `docs/proof/`:

- `docs/proof/demo.gif` (or `demo.mp4`)
- `docs/proof/01-dashboard-connected.png`
- `docs/proof/02-trigger-processing.png`
- `docs/proof/03-hud-confirmation.png`
- `docs/proof/04-event-log.png`

Suggested capture flow:

1. Open **Dashboard** → tap **Connect glasses**
2. Tap **Button** (or **Gesture**) under **Proxy Trigger**
3. Observe phone processing state change
4. Observe **Glasses HUD Simulator** display `Confirmed: <trigger> ✓`
5. Open **Event log** and show the trigger + HUD push entries

Note: the mock bridge is used to validate the proxy flow in the absence of physical glasses hardware. When hardware is available, the same app-level logic can be reused by swapping the bridge implementation.
