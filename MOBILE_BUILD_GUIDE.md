# Mobile App Build Guide (Android & iOS)

This guide helps you generate the installation files (APK/IPA) for Google Play Store and Apple App Store.

## Prerequisites
- **Android**: Install [Android Studio](https://developer.android.com/studio).
- **iOS**: Install [Xcode](https://developer.apple.com/xcode/) (Mac only).

## 1. Syncing Changes
Whenever you change your React/Frontend code, run this command to update the mobile projects:
```bash
npm run build && npx cap sync
```

## 2. Building for Android (Play Store)
1.  **Open Terminal and Navigate to Project**:
    ```bash
    cd /Users/sivaram/Downloads/gym_app
    ```
2.  **Open Android Studio**:
    ```bash
    npx cap open android
    ```
3.  Wait for Gradle sync to finish.
4.  **Run on Emulator**: Click the "Run" (Green Play) button to test.
4.  **Generate Signed APK/Bundle (For Play Store)**:
    - Go to **Build** > **Generate Signed Bundle / APK**.
    - Select **Android App Bundle**.
    - Create a new Key Store (keep this safe!).
    - Finish the wizard to generate your `.aab` file.
    - Upload this file to the Google Play Console.

## 3. Building for iOS (App Store)
1.  **Open Xcode**:
    ```bash
    npx cap open ios
    ```
2.  **Configure Team**:
    - Click on "App" in the file navigator (left).
    - Go to **Signing & Capabilities**.
    - Select your Apple Developer Team.
3.  **Run on Simulator**: Select a device and click Play.
4.  **Archive for App Store**:
    - Go to **Product** > **Destination** > **Any iOS Device (arm64)**.
    - Go to **Product** > **Archive**.
    - Once finished, the Organizer window opens.
    - Click **Distribute App** to upload to App Store Connect.

## Troubleshooting
- **App is Slow / "Network Error"**:
    1.  **Cold Start**: Your server on Render goes to sleep when not used. The **first load** can take 50+ seconds. Be patient!
    2.  **Emulator Slowness**: The Android Emulator is very slow. The app will be **much faster** on a real phone.
- **API Issues**: If data doesn't load, ensure your `VITE_API_URL` fallback in `store.jsx` points to your live HTTPS server.
- **Icon Update**: To update icons, replace the images in `android/app/src/main/res` and `ios/App/App/Assets.xcassets`.
