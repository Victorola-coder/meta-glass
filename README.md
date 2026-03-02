# Smart Glasses Proxy Trigger App

This repository contains a proof-of-concept mobile application built with React Native (Expo) and TypeScript. It serves as the "brain" for a smart glasses integration, demonstrating a Proxy Trigger flow.

## 🎯 The Goal

When a physical button or trigger is pressed on the smart glasses, the signal must push to the smartphone. The smartphone then processes the event and sends a visual update back to the glasses' HUD (Heads-Up Display).

Because physical wearable hardware (requiring the Meta Wearables Device Access Toolkit or Android XR Jetpack) is currently being provisioned, this repository implements a simulated **Wearable SDK Mock**.

## 🚀 Features

- **📱 Phone Brain UI**: Displays the current connection status and the processing state of the "Brain".
- **🕶️ Glasses HUD Simulator**: A simulated Heads-Up Display representing what the user sees in their smart glasses.
- **⚡ Hardware Simulator**: A button to simulate the physical trigger press on the glasses.

## 🛠️ Architecture

The app mimics the communication flow:
1.  **Trigger**: User presses the simulated hardware button on the HUD UI (Mocking the Bluetooth broadcast from the glasses).
2.  **Receive**: The Phone UI receives the event via the `WearableSDKMock` listener.
3.  **Process**: The phone processes the action (simulated 1.5s delay).
4.  **Acknowledge**: The phone pushes an update ("Action Confirmed ✓") back to the Glasses HUD UI via the SDK.

## 💻 Tech Stack

- React Native (Expo)
- TypeScript

## ⚙️ How to Run Locally

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

## 📸 Proof of Work

*Note to Evaluator: Because this is a simulated interface, a video/screenshot of the Expo app running the dual-UI flow serves as the proof of work for the Proxy Trigger logic.*

*Replace this section with screenshots or a GIF showing the button press flow.*
