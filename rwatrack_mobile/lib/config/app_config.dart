// RWATRACK Mobile App Configuration
// Edit this file to configure your app for your network

class AppConfig {
  // SERVER CONFIGURATION
  // ⚠️ Change this to your computer's WiFi IP address!
  // Find it: Windows → ipconfig | Mac → ifconfig
  // DO NOT use 127.0.0.1 — that's the phone's own localhost
  static const String serverUrl = 'http://localhost:3000';

  // APP CONFIGURATION
  static const String appName = 'RWATRACK';
  static const String appVersion = '1.0.0';

  // LOCATION TRACKING
  static const Duration locationUpdateInterval = Duration(minutes: 5);
  static const double locationAccuracyThreshold = 50.0;

  // OFFLINE SYNC
  static const Duration syncRetryInterval = Duration(minutes: 2);
  static const int maxRetryAttempts = 5;

  // NOTIFICATION POLLING
  static const Duration notificationPollInterval = Duration(seconds: 30);

  // THEME
  static const bool enableDarkMode = false;

  // DEBUG MODE
  static const bool enableDebugLogging = true;
  static const bool enableMockLocation = false;
}
