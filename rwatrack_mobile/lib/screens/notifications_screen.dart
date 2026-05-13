import 'package:flutter/material.dart';
import '../services/notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _loading = true);
    final result = await NotificationService.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = result['notifications'] as List<NotificationModel>;
        _unreadCount = result['unreadCount'] as int;
        _loading = false;
      });
    }
  }

  Future<void> _markAllRead() async {
    await NotificationService.markAllRead();
    if (mounted) {
      setState(() {
        _notifications = _notifications.map((n) => NotificationModel(
          id: n.id, title: n.title, message: n.message,
          type: n.type, read: true, createdAt: n.createdAt,
        )).toList();
        _unreadCount = 0;
      });
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'REGISTRATION': return const Color(0xFF3B82F6);
      case 'APPROVAL': return const Color(0xFF22C55E);
      case 'REJECTION': return const Color(0xFFEF4444);
      default: return const Color(0xFF94A3B8);
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'REGISTRATION': return Icons.person_add_rounded;
      case 'APPROVAL': return Icons.check_circle_rounded;
      case 'REJECTION': return Icons.cancel_rounded;
      default: return Icons.info_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEFF6FF),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text('Notifications', style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
        actions: [
          if (_unreadCount > 0)
            TextButton.icon(
              onPressed: _markAllRead,
              icon: const Icon(Icons.done_all_rounded, size: 18),
              label: const Text('Mark all read'),
              style: TextButton.styleFrom(foregroundColor: const Color(0xFF3B82F6)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadNotifications,
              child: _notifications.isEmpty
                  ? ListView(children: [
                      const SizedBox(height: 120),
                      Center(child: Column(children: [
                        Icon(Icons.notifications_off_rounded, size: 64, color: Colors.grey[300]),
                        const SizedBox(height: 16),
                        Text('No notifications yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.grey[600])),
                        const SizedBox(height: 8),
                        Text("You'll be notified when\nsomething happens", textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: Colors.grey[400])),
                      ])),
                    ])
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _notifications.length,
                      itemBuilder: (ctx, i) {
                        final n = _notifications[i];
                        final color = _getTypeColor(n.type);
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: n.read ? Colors.white : color.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: n.read ? const Color(0xFFBFDBFE) : color.withOpacity(0.3)),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Container(
                                width: 40, height: 40,
                                decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
                                child: Icon(_getTypeIcon(n.type), color: color, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Row(children: [
                                  Expanded(child: Text(n.title, style: TextStyle(fontSize: 14, fontWeight: n.read ? FontWeight.w600 : FontWeight.w700, color: const Color(0xFF1E293B)))),
                                  if (!n.read) Container(width: 8, height: 8, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
                                ]),
                                const SizedBox(height: 4),
                                Text(n.message, style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.5)),
                                const SizedBox(height: 6),
                                Text(NotificationService.timeAgo(n.createdAt), style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                              ])),
                            ]),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
