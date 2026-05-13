import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import 'cache_service.dart';

class ApiService {
  // 🔧 CONFIGURABLE: Change this to your computer's IP address or domain
  // For development: Use your computer's IP (e.g., '192.168.1.100')
  // For production: Use your domain (e.g., 'https://api.rwatrack.com')
  static const String baseUrl = AppConfig.serverUrl;

  static http.Client client = http.Client();
  static bool enableCaching = true;
  static const _storage = FlutterSecureStorage();
  static const String _tokenKey = 'rwatrack_token';
  static const String _userKey = 'rwatrack_user';

  // ─── TOKEN MANAGEMENT ───────────────────────────────────

  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  static Future<void> saveUser(Map<String, dynamic> user) async {
    await _storage.write(key: _userKey, value: jsonEncode(user));
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final raw = await _storage.read(key: _userKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  static Future<void> clearSession() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // ─── HTTP HELPERS ────────────────────────────────────────

  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // ─── AUTH ────────────────────────────────────────────────

  static Future<Map<String, dynamic>> login(String email, String password, {String? role}) async {
    try {
      final res = await client.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: await _headers(auth: false),
        body: jsonEncode({
          'email': email.trim().toLowerCase(),
          'password': password,
          'role': role ?? 'WORKER', // Allow specifying role, default to WORKER
        }),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Login failed',
          'pending': data['pending'] ?? false,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Connection failed. Make sure your phone and computer are on the same WiFi.',
      };
    }
  }

  static Future<void> logout() async {
    try {
      await client.post(
        Uri.parse('$baseUrl/api/auth/logout'),
        headers: await _headers(),
      ).timeout(const Duration(seconds: 5));
    } catch (_) {}
    await clearSession();
  }

  // ─── LOCATION ────────────────────────────────────────────

  static Future<bool> sendLocation(double lat, double lng, double accuracy) async {
    try {
      final res = await client.post(
        Uri.parse('$baseUrl/api/location-logs'),
        headers: await _headers(),
        body: jsonEncode({'lat': lat, 'lng': lng, 'accuracy': accuracy}),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      // Cache for retry later (only if enabled)
      if (enableCaching) {
        await CacheService.addPendingLocation({
          'lat': lat,
          'lng': lng,
          'accuracy': accuracy,
          'timestamp': DateTime.now().toIso8601String(),
        });
      }
      return false;
    }
  }

  static Future<void> retryPendingLocations() async {
    await CacheService.retryPendingLocations((location) async {
      return await sendLocation(
        location['lat'] as double,
        location['lng'] as double,
        location['accuracy'] as double,
      );
    });
  }

  static Future<List<Map<String, dynamic>>> getLocationLogs() async {
    try {
      final res = await client.get(
        Uri.parse('$baseUrl/api/location-logs'),
        headers: await _headers(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data is List) {
          final logs = data.cast<Map<String, dynamic>>();
          // Cache successful response
          await CacheService.cacheLocationLogs(logs);
          return logs;
        }
      }
      // Fall back to cache on error
      return await CacheService.getCachedLocationLogs();
    } catch (_) {
      // Return cached data when offline
      return await CacheService.getCachedLocationLogs();
    }
  }
}