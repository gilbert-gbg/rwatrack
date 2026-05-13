import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'api_service.dart';

class LocationService {
  static StreamSubscription<Position>? _subscription;
  static bool _isTracking = false;
  static Position? _lastPosition;
  static DateTime? _lastSent;

  static bool get isTracking => _isTracking;
  static Position? get lastPosition => _lastPosition;

  // ─── PERMISSIONS ─────────────────────────────────────────

  static Future<bool> requestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    if (permission == LocationPermission.deniedForever) return false;
    return true;
  }

  static Future<bool> hasPermission() async {
    final permission = await Geolocator.checkPermission();
    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  // ─── TRACKING ────────────────────────────────────────────

  static Future<void> startTracking({
    Function(Position)? onLocation,
    Function(bool)? onStatusChange,
  }) async {
    if (_isTracking) return;

    final hasPerms = await hasPermission();
    if (!hasPerms) return;

    _isTracking = true;
    onStatusChange?.call(true);

    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 100, // Update every 100 meters
    );

    _subscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) async {
        _lastPosition = position;
        onLocation?.call(position);

        // Send to server every 5 minutes or on first location
        final now = DateTime.now();
        if (_lastSent == null ||
            now.difference(_lastSent!).inMinutes >= 5) {
          final sent = await ApiService.sendLocation(
            position.latitude,
            position.longitude,
            position.accuracy,
          );
          if (sent) _lastSent = now;
        }
      },
      onError: (error) {
        _isTracking = false;
        onStatusChange?.call(false);
      },
    );
  }

  static Future<Position?> getCurrentPosition() async {
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
    } catch (_) {
      return null;
    }
  }

  static void stopTracking() {
    _subscription?.cancel();
    _subscription = null;
    _isTracking = false;
    _lastSent = null;
  }
}