import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String type;
  final bool read;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.read,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'INFO',
      read: json['read'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

class NotificationService {
  static Future<Map<String, dynamic>> getNotifications() async {
    try {
      final token = await ApiService.getToken();
      final headers = <String, String>{
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };
      final res = await http.get(
        Uri.parse('${ApiService.baseUrl}/api/notifications'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['notifications'] as List)
            .map((n) => NotificationModel.fromJson(n))
            .toList();
        return {'notifications': list, 'unreadCount': data['unreadCount'] ?? 0};
      }
      return {'notifications': <NotificationModel>[], 'unreadCount': 0};
    } catch (_) {
      return {'notifications': <NotificationModel>[], 'unreadCount': 0};
    }
  }

  static Future<void> markAllRead() async {
    try {
      final token = await ApiService.getToken();
      final headers = <String, String>{
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };
      await http.patch(
        Uri.parse('${ApiService.baseUrl}/api/notifications'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
    } catch (_) {}
  }

  static String timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  }
}
