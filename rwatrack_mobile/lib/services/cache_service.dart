import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class CacheService {
  static const String _locationLogsKey = 'cached_location_logs';
  static const String _pendingLocationsKey = 'pending_locations';

  static Future<void> cacheLocationLogs(List<Map<String, dynamic>> logs) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_locationLogsKey, jsonEncode(logs));
  }

  static Future<List<Map<String, dynamic>>> getCachedLocationLogs() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_locationLogsKey);
    if (data != null) {
      final decoded = jsonDecode(data) as List;
      return decoded.cast<Map<String, dynamic>>();
    }
    return [];
  }

  static Future<void> addPendingLocation(Map<String, dynamic> location) async {
    final prefs = await SharedPreferences.getInstance();
    final pending = await getPendingLocations();
    pending.add(location);
    await prefs.setString(_pendingLocationsKey, jsonEncode(pending));
  }

  static Future<List<Map<String, dynamic>>> getPendingLocations() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_pendingLocationsKey);
    if (data != null) {
      final decoded = jsonDecode(data) as List;
      return decoded.cast<Map<String, dynamic>>();
    }
    return [];
  }

  static Future<void> clearPendingLocations() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_pendingLocationsKey);
  }

  static Future<void> retryPendingLocations(Function(Map<String, dynamic>) sendFunction) async {
    final pending = await getPendingLocations();
    final successful = <Map<String, dynamic>>[];

    for (final location in pending) {
      try {
        final sent = await sendFunction(location);
        if (sent) successful.add(location);
      } catch (_) {
        // Keep failed ones in pending
      }
    }

    // Remove successful ones
    final remaining = pending.where((loc) => !successful.contains(loc)).toList();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_pendingLocationsKey, jsonEncode(remaining));
  }
}