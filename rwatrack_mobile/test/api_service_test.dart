import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:rwatrack_mobile/services/api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late http.Client originalClient;
  late bool originalCaching;

  late MethodChannel storageChannel;

  setUp(() async {
    originalClient = ApiService.client;
    originalCaching = ApiService.enableCaching;
    ApiService.enableCaching = false;

    SharedPreferences.setMockInitialValues({});

    storageChannel = const MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(storageChannel, (MethodCall methodCall) async {
      switch (methodCall.method) {
        case 'write':
          return null;
        case 'read':
          return 'mock_token';
        case 'delete':
          return null;
        default:
          return null;
      }
    });

    // Mock a token for auth
    await ApiService.saveToken('mock_token');
  });

  tearDown(() {
    ApiService.client = originalClient;
    ApiService.enableCaching = originalCaching;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(storageChannel, null);
  });

  test('login returns success when server responds with 200', () async {
    ApiService.client = MockClient((request) async {
      expect(request.method, 'POST');
      expect(request.url.path, '/api/auth/login');
      return http.Response(jsonEncode({'token': 'abc', 'user': {'role': 'WORKER'}}), 200);
    });

    final result = await ApiService.login('test@example.com', 'password');

    expect(result['success'], isTrue);
    expect(result['data'], isA<Map<String, dynamic>>());
  });

  test('login returns failure when server sends error response', () async {
    ApiService.client = MockClient((request) async {
      return http.Response(jsonEncode({'error': 'Invalid credentials'}), 401);
    });

    final result = await ApiService.login('test@example.com', 'wrong');

    expect(result['success'], isFalse);
    expect(result['error'], 'Invalid credentials');
  });

  test('sendLocation returns true for valid location submission', () async {
    ApiService.client = MockClient((request) async {
      expect(request.url.path, '/api/location-logs');
      return http.Response('{"success": true}', 201);
    });

    final result = await ApiService.sendLocation(1.0, 2.0, 10.0);

    expect(result, isTrue);
  });

  test('sendLocation returns false on network error', () async {
    ApiService.client = MockClient((request) async {
      throw Exception('Network error');
    });

    final result = await ApiService.sendLocation(1.0, 2.0, 10.0);

    expect(result, isFalse);
  });

  test('getLocationLogs returns list of logs on success', () async {
    ApiService.client = MockClient((request) async {
      return http.Response(jsonEncode([
        {'lat': 1.0, 'lng': 2.0, 'recordedAt': '2023-01-01T00:00:00Z'}
      ]), 200);
    });

    final logs = await ApiService.getLocationLogs();

    expect(logs, isA<List<Map<String, dynamic>>>());
    expect(logs.length, 1);
    expect(logs.first['lat'], 1.0);
  });

  test('getLocationLogs returns empty list on error', () async {
    ApiService.client = MockClient((request) async {
      throw Exception('Error');
    });

    final logs = await ApiService.getLocationLogs();

    expect(logs, isEmpty);
  });
}