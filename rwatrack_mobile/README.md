# RWATRACK Mobile App

RWATRACK is a worker-facing mobile portal for government employee location tracking and attendance verification.

## Project structure

- `lib/`: Flutter app source code
  - `screens/`: UI screens including login, permissions, home dashboard
  - `services/`: API and location service logic
  - `theme/`: app styling and colors
- `test/`: widget and unit tests
- `android/`, `ios/`, `linux/`, `macos/`, `windows/`: platform support

## Getting started

1. Install Flutter: https://docs.flutter.dev/get-started/install
2. Open `rwatrack_mobile` in your terminal
3. Run:
   ```bash
   flutter pub get
   flutter run
   ```

## Running tests

From the `rwatrack_mobile` folder:

```bash
flutter test
```

## Improvements added

- Real widget tests for `LoginScreen` and `LocationPermissionScreen`
- Unit tests for `ApiService` HTTP behavior
- Injected `http.Client` into `ApiService` for easier test mocking
- GitHub Actions workflow to run `flutter analyze` and `flutter test`
- Updated project README with setup and testing guidance

## Notes

- Update `lib/services/api_service.dart` if your backend IP address changes.
- This app uses secure storage, location permissions, and periodic location reporting.
- For production, verify backend URLs, permissions handling, and privacy disclosures.
