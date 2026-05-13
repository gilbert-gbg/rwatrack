import 'dart:async';
import 'package:flutter/material.dart';
import '../services/notification_service.dart';
import 'home_screen.dart';
import 'messages_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  int _unreadNotifications = 0;
  Timer? _notifTimer;

  final _screens = const [
    HomeScreen(),
    MessagesScreen(),
    NotificationsScreen(),
    ProfileScreen(),
    SettingsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _fetchNotificationCount();
    _notifTimer = Timer.periodic(const Duration(seconds: 30), (_) => _fetchNotificationCount());
  }

  Future<void> _fetchNotificationCount() async {
    final result = await NotificationService.getNotifications();
    if (mounted) setState(() => _unreadNotifications = result['unreadCount'] as int);
  }

  @override
  void dispose() { _notifTimer?.cancel(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 20, offset: const Offset(0, -4)),
        ]),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (i) {
              setState(() => _currentIndex = i);
              if (i == 2) _fetchNotificationCount();
            },
            type: BottomNavigationBarType.fixed,
            backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
            selectedItemColor: const Color(0xFF3B82F6),
            unselectedItemColor: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
            selectedFontSize: 11,
            unselectedFontSize: 10,
            selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700),
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.home_rounded),
                activeIcon: Icon(Icons.home_rounded, size: 26),
                label: 'Home',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.chat_bubble_outline_rounded),
                activeIcon: Icon(Icons.chat_bubble_rounded, size: 26),
                label: 'Messages',
              ),
              BottomNavigationBarItem(
                icon: Stack(clipBehavior: Clip.none, children: [
                  const Icon(Icons.notifications_outlined),
                  if (_unreadNotifications > 0) Positioned(right: -6, top: -4,
                    child: Container(padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                      child: Text(_unreadNotifications > 9 ? '9+' : '$_unreadNotifications',
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)))),
                ]),
                activeIcon: Stack(clipBehavior: Clip.none, children: [
                  const Icon(Icons.notifications_rounded, size: 26),
                  if (_unreadNotifications > 0) Positioned(right: -6, top: -4,
                    child: Container(padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                      child: Text(_unreadNotifications > 9 ? '9+' : '$_unreadNotifications',
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)))),
                ]),
                label: 'Alerts',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.person_outline_rounded),
                activeIcon: Icon(Icons.person_rounded, size: 26),
                label: 'Profile',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.settings_outlined),
                activeIcon: Icon(Icons.settings_rounded, size: 26),
                label: 'Settings',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
