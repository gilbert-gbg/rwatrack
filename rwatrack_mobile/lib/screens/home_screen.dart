import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../services/location_service.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';
import 'settings_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import '../services/notification_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _user;
  Position? _lastPosition;
  bool _tracking = false;
  bool _loading = true;
  List<Map<String, dynamic>> _locationLogs = [];
  Timer? _clockTimer;
  DateTime _currentTime = DateTime.now();
  int _locationsSent = 0;
  int _unreadNotifications = 0;
  ConnectivityResult _connectivityStatus = ConnectivityResult.none;
  late StreamSubscription<List<ConnectivityResult>> _connectivitySubscription;

  @override
  void initState() {
    super.initState();
    _loadData();
    _startClock();
    _initConnectivity();
  }

  Future<void> _initConnectivity() async {
    final connectivity = Connectivity();

    // Get initial connectivity status
    final results = await connectivity.checkConnectivity();
    final result = results.isNotEmpty ? results.first : ConnectivityResult.none;
    setState(() => _connectivityStatus = result);

    // Listen for connectivity changes
    _connectivitySubscription = connectivity.onConnectivityChanged.listen(
      (List<ConnectivityResult> results) {
        if (mounted && results.isNotEmpty) {
          final result = results.first;
          setState(() => _connectivityStatus = result);
          // Retry pending locations when connection is restored
          if (result != ConnectivityResult.none) {
            ApiService.retryPendingLocations();
          }
        }
      },
    );
  }

  void _startClock() {
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _currentTime = DateTime.now());
    });
  }

  Future<void> _loadData() async {
    final user = await ApiService.getUser();
    final logs = await ApiService.getLocationLogs();
    if (mounted) {
      setState(() {
        _user = user;
        _locationLogs = logs.take(5).toList();
        _loading = false;
      });
    }
    await _startTracking();
    // Fetch notifications
    final notifResult = await NotificationService.getNotifications();
    if (mounted) {
      setState(() => _unreadNotifications = notifResult['unreadCount'] as int);
    }
  }

  Future<void> _startTracking() async {
    await LocationService.startTracking(
      onLocation: (position) {
        if (mounted) {
          setState(() {
            _lastPosition = position;
            _locationsSent++;
          });
        }
      },
      onStatusChange: (tracking) {
        if (mounted) setState(() => _tracking = tracking);
      },
    );
    if (mounted) setState(() => _tracking = LocationService.isTracking);
  }

  Future<void> _handleLogout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      LocationService.stopTracking();
      await authProvider.logout();
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    }
  }

  Future<void> _refreshLocation() async {
    final position = await LocationService.getCurrentPosition();
    if (position != null && mounted) {
      setState(() => _lastPosition = position);
      final sent = await ApiService.sendLocation(
        position.latitude,
        position.longitude,
        position.accuracy,
      );
      if (sent && mounted) {
        setState(() {
          _locationsSent++;
        });
        // Retry any pending locations
        await ApiService.retryPendingLocations();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('📍 Location updated successfully!'),
              backgroundColor: AppTheme.success,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    }
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _connectivitySubscription.cancel();
    LocationService.stopTracking();
    super.dispose();
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    final s = dt.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  String _formatDate(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return '${days[dt.weekday - 1]}, ${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final firstName = _user?['firstName'] ?? '';
    final lastName = _user?['lastName'] ?? '';
    final email = _user?['email'] ?? '';
    final initials = '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}';

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [

                // ── HEADER ─────────────────────────────────
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x0F000000),
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppTheme.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.location_on_rounded,
                          size: 20,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'RWATRACK',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.textDark,
                              letterSpacing: 1,
                            ),
                          ),
                          Text(
                            'Worker Portal',
                            style: TextStyle(fontSize: 11, color: AppTheme.textLight),
                          ),
                        ],
                      ),
                      // Network Status Indicator
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _connectivityStatus == ConnectivityResult.none
                              ? AppTheme.error.withValues(alpha: 0.1)
                              : AppTheme.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _connectivityStatus == ConnectivityResult.none
                                ? AppTheme.error.withValues(alpha: 0.3)
                                : AppTheme.success.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _connectivityStatus == ConnectivityResult.none
                                  ? Icons.wifi_off
                                  : Icons.wifi,
                              size: 14,
                              color: _connectivityStatus == ConnectivityResult.none
                                  ? AppTheme.error
                                  : AppTheme.success,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _connectivityStatus == ConnectivityResult.none
                                  ? 'Offline'
                                  : 'Online',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: _connectivityStatus == ConnectivityResult.none
                                    ? AppTheme.error
                                    : AppTheme.success,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      // Notification bell
                      Stack(
                        children: [
                          IconButton(
                            onPressed: () async {
                              await Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                              final r = await NotificationService.getNotifications();
                              if (mounted) setState(() => _unreadNotifications = r['unreadCount'] as int);
                            },
                            icon: const Icon(Icons.notifications_outlined, color: AppTheme.textMid),
                            tooltip: 'Notifications',
                          ),
                          if (_unreadNotifications > 0)
                            Positioned(
                              right: 8, top: 8,
                              child: Container(
                                width: 16, height: 16,
                                decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                                child: Center(child: Text(
                                  _unreadNotifications > 9 ? '9+' : '$_unreadNotifications',
                                  style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                )),
                              ),
                            ),
                        ],
                      ),
                      // Profile
                      IconButton(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())),
                        icon: const Icon(Icons.person_outline_rounded, color: AppTheme.textMid),
                        tooltip: 'Profile',
                      ),
                      // Settings
                      IconButton(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
                        icon: const Icon(Icons.settings, color: AppTheme.textMid),
                        tooltip: 'Settings',
                      ),
                      IconButton(
                        onPressed: _handleLogout,
                        icon: const Icon(Icons.logout_rounded, color: AppTheme.textMid),
                        tooltip: 'Sign Out',
                      ),
                    ],
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [

                      // ── WELCOME CARD ───────────────────────
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppTheme.primary, AppTheme.primaryDark],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primary.withValues(alpha: 0.35),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundColor: Colors.white24,
                              child: Text(
                                initials.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Welcome, $firstName!',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    _formatDate(_currentTime),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.white70,
                                    ),
                                  ),
                                  Text(
                                    _formatTime(_currentTime),
                                    style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // ── TRACKING STATUS CARD ───────────────
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.border),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x08000000),
                              blurRadius: 8,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 12,
                                  height: 12,
                                  decoration: BoxDecoration(
                                    color: _tracking ? AppTheme.success : AppTheme.textLight,
                                    borderRadius: BorderRadius.circular(6),
                                    boxShadow: _tracking ? [
                                      BoxShadow(
                                        color: AppTheme.success.withValues(alpha: 0.4),
                                        blurRadius: 6,
                                        spreadRadius: 2,
                                      ),
                                    ] : null,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _tracking ? 'Location Tracking Active' : 'Location Tracking Inactive',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 14,
                                          color: AppTheme.textDark,
                                        ),
                                      ),
                                      Text(
                                        _tracking
                                            ? 'Your location is being monitored for work verification'
                                            : 'Location tracking is not running',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppTheme.textLight,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  onPressed: _refreshLocation,
                                  icon: const Icon(Icons.refresh_rounded, color: AppTheme.primary),
                                  tooltip: 'Send location now',
                                ),
                              ],
                            ),
                            if (_lastPosition != null) ...[
                              const Divider(height: 16),
                              Row(
                                children: [
                                  const Icon(Icons.gps_fixed, size: 14, color: AppTheme.textLight),
                                  const SizedBox(width: 6),
                                  Text(
                                    '${_lastPosition!.latitude.toStringAsFixed(5)}, ${_lastPosition!.longitude.toStringAsFixed(5)}',
                                    style: const TextStyle(fontSize: 12, color: AppTheme.textMid, fontFamily: 'monospace'),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.send_rounded, size: 14, color: AppTheme.textLight),
                                  const SizedBox(width: 6),
                                  Text(
                                    '$_locationsSent locations sent to server',
                                    style: const TextStyle(fontSize: 12, color: AppTheme.textLight),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // ── PROFILE CARD ───────────────────────
                      _sectionCard(
                        title: 'My Profile',
                        icon: Icons.person_outline_rounded,
                        children: [
                          _infoRow(Icons.person_rounded, 'Full Name', '$firstName $lastName'),
                          _infoRow(Icons.email_outlined, 'Email', email),
                          if (_user?['phone'] != null)
                            _infoRow(Icons.phone_outlined, 'Phone', _user!['phone']),
                          _infoRow(
                            Icons.verified_user_rounded,
                            'Status',
                            _user?['status'] ?? 'ACTIVE',
                            valueColor: _user?['status'] == 'ACTIVE' ? AppTheme.success : AppTheme.warning,
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // ── RECENT LOCATION LOGS ───────────────
                      _sectionCard(
                        title: 'Recent Location Activity',
                        icon: Icons.history_rounded,
                        children: _locationLogs.isEmpty
                            ? [
                                const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 16),
                                  child: Column(
                                    children: [
                                      Icon(Icons.location_off, color: AppTheme.textLight, size: 36),
                                      SizedBox(height: 8),
                                      Text(
                                        'No location data yet',
                                        style: TextStyle(color: AppTheme.textLight),
                                      ),
                                      Text(
                                        'Move around to start generating location data',
                                        style: TextStyle(color: AppTheme.textLight, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                              ]
                            : _locationLogs.asMap().entries.map((entry) {
                                final i = entry.key;
                                final log = entry.value;
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: i == 0 ? AppTheme.primaryLight : AppTheme.background,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 28,
                                        height: 28,
                                        decoration: BoxDecoration(
                                          color: i == 0 ? AppTheme.primary : AppTheme.textLight,
                                          borderRadius: BorderRadius.circular(14),
                                        ),
                                        child: Center(
                                          child: Text(
                                            i == 0 ? '●' : '${i + 1}',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              '${(log['lat'] as num).toStringAsFixed(5)}, ${(log['lng'] as num).toStringAsFixed(5)}',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                color: AppTheme.textDark,
                                                fontFamily: 'monospace',
                                              ),
                                            ),
                                            if (log['recordedAt'] != null)
                                              Text(
                                                log['recordedAt'].toString().substring(0, 16).replaceAll('T', ' '),
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  color: AppTheme.textLight,
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                      if (i == 0)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppTheme.success.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: const Text(
                                            'Latest',
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: AppTheme.success,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                );
                              }).toList(),
                      ),

                      const SizedBox(height: 16),

                      // ── PRIVACY NOTE ───────────────────────
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.security_rounded, color: AppTheme.primary, size: 18),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Your location is collected periodically during working hours to confirm your assigned workplace. Data is used only for work-related purposes.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.primaryDark,
                                  height: 1.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(icon, color: AppTheme.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: children),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppTheme.background,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: AppTheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textLight),
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: valueColor ?? AppTheme.textDark,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}