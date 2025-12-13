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
> [!IMPORTANT]
> You need a **Google Play Developer Account** ($25 one-time fee) to upload to the Play Store.

1.  **Open Terminal and Navigate to Project**:
    ```bash
    cd /Users/sivaram/Downloads/gym_app
    ```
2.  **Open Android Studio**:
    ```bash
    npx cap open android
    ```
3.  **Generate Signed App Bundle (.aab)**:
    - Go to **Build** > **Generate Signed Bundle / APK**.
    - Select **Android App Bundle** (Required for Play Store) > Next.
    - **Key Store Path**: Click "Create new" if you don't have one. Save it safely!
    - **Key/Keystore Password**: Remember these.
    - Click **Next/Finish** to generate the file.
    - Locate the file (usually in `android/app/release/app-release.aab`).

4.  **Upload to Play Console**:
    - Go to [Google Play Console](https://play.google.com/console).
    - **Create App**: Enter name "Gymtics", language, etc.
    - **Dashboard**: Follow the "Set up your app" checklist (Privacy Policy, App Content, etc.).
    - **Create Release**: Go to **Testing > Closed testing** (or Production).
    - Click **Create new release**.
    - Upload your `.aab` file here.
    - Click **Next** > **Save** > **Send for Review**.

## 3. Building for iOS (App Store)
> [!IMPORTANT]
> You need a **Paid Apple Developer Account** ($99/year) to upload to the App Store.

1.  **Open Project in Xcode**:
    ```bash
    cd /Users/sivaram/Downloads/gym_app
    npx cap open ios
    ```
2.  **Configure Signing**:
    - In Xcode, click on **"App"** (the blue icon) in the left file navigator.
    - Click on the **Signing & Capabilities** tab.
    - Under **Team**, select your Apple Developer Account.
    - Ensure "Automatically manage signing" is checked.
3.  **Create the Build (Archive)**:
    - In the top toolbar, change the device (where it says "iPhone 16 pro" etc.) to **"Any iOS Device (arm64)"**.
    - Go to the top menu: **Product** > **Archive**.
    - Wait for the build to finish.
4.  **Upload to App Store**:
    - Once the Archive is done, the **Organizer** window will open.
    - Select your new build.
    - Click the blue **Distribute App** button.
    - Select **App Store Connect** > **Upload** > **Next**.
    - Follow the prompts to upload.
5.  **Finish in Browser**:
    - Go to [App Store Connect](https://appstoreconnect.apple.com/).
    - Create a new App, select the build you just uploaded, and fill in the store details.

## 4. Option: Self-Hosting (Android Only)
If you don't want to use the Play Store, you can let users download the app directly from your website.

> [!WARNING]
> This **only works for Android**. iOS users cannot install apps from websites (unless you pay $299/year for an Enterprise account).

1.  **Generate APK (Not Bundle)**:
    - In Android Studio: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
    - (Note: This is different from "Generate Signed Bundle").
2.  **Locate the File**:
    - It will be in `android/app/build/outputs/apk/debug/app-debug.apk`.
3.  **Upload to Website**:
    - Upload this `.apk` file to your website or Google Drive.
    - Share the link.
4.  **User Installation**:
    - Users download the file.
    - They must enable **"Install from Unknown Sources"** on their phone settings to install it.

## Troubleshooting
- **App is Slow / "Network Error"**:
    1.  **Cold Start**: Your server on Render goes to sleep when not used. The **first load** can take 50+ seconds. Be patient!
    2.  **Emulator Slowness**: The Android Emulator is very slow. The app will be **much faster** on a real phone.
- **API Issues**: If data doesn't load, ensure your `VITE_API_URL` fallback in `store.jsx` points to your live HTTPS server.
- **Icon Update**: To update icons, replace the images in `android/app/src/main/res` and `ios/App/App/Assets.xcassets`.
