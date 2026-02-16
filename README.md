# RSVP Document Reader

A high-performance **Rapid Serial Visual Presentation (RSVP)** document reader built with **React Native** and **Expo**. This application is designed to help users speed-read documents by displaying text one word at a time at a user-controlled speed, minimizing eye movement and increasing reading efficiency.

## 🚀 Features

- **📚 Universal Document Support**: Seamlessly import and read both **PDF** and **EPUB** files.
- **⚡ RSVP Speed Reading**: Adjustable Words Per Minute (WPM) control to match your reading speed.
- **🧠 Smart Context**: Displays surrounding words when paused so you never lose your place.
- **💾 Progress Tracking**: Automatically saves your reading position for every document via a local SQLite database.
- **📂 Library Management**: Organize your documents with Grid/List views, search, and sorting options.
- **🎨 Premium Design**: A beautiful, dark-mode first UI featuring custom typography (EB Garamond, Instrument Serif, Inter) and smooth animations.
- **🖼️ Auto-Thumbnails**: Automatically generates thumbnails for your PDF documents for a visual library experience.

## 📥 Download

Get the latest Android release:

[![Download Android APK](https://img.shields.io/badge/Download-Android%20APK-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/manyakaistha/RSVP-PDF-Reader/releases/download/v0.0.01/Flux.Reader.apk)

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (Expo SDK 54)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Text Extraction**: Custom engine using `pdf.js` (via WebView) for robust local processing.
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Fonts**: [Expo Google Fonts](https://github.com/expo/google-fonts)

## 📱 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rsvp-doc-reader.git
   cd rsvp-doc-reader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npx expo start
   ```

4. **Run on Device/Simulator**
   - Press `i` to open in iOS Simulator
   - Press `a` to open in Android Emulator
   - Scan the QR code with Expo Go on your physical device

## 📥 Download & Install

You can download the latest Android APK directly from here:

[![Download APK](https://img.shields.io/badge/Download-APK-2E7D32?style=for-the-badge&logo=android&logoColor=white)](https://github.com/manyakaistha/Flux-Reader/releases/download/v0.0.01/Flux.Reader.apk)

### How to Install (using Google Files)

1.  **Download**: Click the button above to download the `Flux.Reader.apk` file.
2.  **Open Google Files**: Launch the "Files by Google" app on your Android device.
3.  **Go to Downloads**: Tap on the **Downloads** category.
4.  **Find the APK**: You should see `Flux.Reader.apk` at the top of the list.
5.  **Install**: Tap on the file.
    *   If prompted, enable "Install from Unknown Sources" for Google Files.
    *   Tap **Install** in the pop-up window.
6.  **Enjoy**: Once installed, tap **Open** to start speed reading!

## 📖 Usage

1. **Import Documents**: Tap the `+` button in the library to import PDF or EPUB files from your device.
2. **Open Reader**: Tap on any document card to open the RSVP reader.
3. **Control Playback**: 
   - Tap the screen to **Play/Pause**.
   - Use the slider to **Scrub** through the document.
   - Adjust **WPM** using the speed controls.
4. **Manage Library**: Long-press a document to view details or delete it. Use the top bar to toggle between Grid/List views or search your collection.

## 📂 Project Structure

```
/app                # Expo Router screens and layouts
/src
  /components       # Reusable UI components
    /library        # Library screen components (Card, Row, Sort)
    /reader         # Reader screen components
    /rsvp           # RSVP specific components (Overlay, Controls)
  /database         # SQLite database initialization and queries
  /hooks            # Custom React hooks (useRSVPEngine, etc.)
  /store            # Zustand state stores
  /utils            # Helper functions and extractors (pdfExtractor, epubExtractor)
  /constants        # App-wide constants (Colors, Layout)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

You can contact me at manyakaistha.dev@gmail.com for any issues or feature requests that you might have.

## 📄 License

This project is licensed under the MIT License.
