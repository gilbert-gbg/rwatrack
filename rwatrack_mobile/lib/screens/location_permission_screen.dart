import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../theme/app_theme.dart';
import 'main_shell.dart';
import 'login_screen.dart';

class LocationPermissionScreen extends StatefulWidget {
  const LocationPermissionScreen({super.key});

  @override
  State<LocationPermissionScreen> createState() => _LocationPermissionScreenState();
}

class _LocationPermissionScreenState extends State<LocationPermissionScreen> {
  bool _loading = false;

  Future<void> _handleAllow() async {
    setState(() => _loading = true);

    final granted = await LocationService.requestPermission();

    if (!mounted) return;
    setState(() => _loading = false);

    if (granted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const MainShell()),
      );
    } else {
      _showPermissionDeniedDialog();
    }
  }

  Future<void> _handleDeny() async {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Cannot Continue'),
        content: const Text(
          'Location access is required for this system to work. '
          'If you deny access, you will be signed out.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Go Back'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            onPressed: () async {
              await ApiService.clearSession();
              if (!mounted) return;
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (_) => false,
              );
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  void _showPermissionDeniedDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.location_off, color: AppTheme.error),
            SizedBox(width: 8),
            Text('Permission Denied'),
          ],
        ),
        content: const Text(
          'Location permission was denied. Please enable it in your device Settings to use RWATRACK.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Icon
              Center(
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryLight,
                    borderRadius: BorderRadius.circular(50),
                  ),
                  child: const Icon(
                    Icons.location_on_rounded,
                    size: 52,
                    color: AppTheme.primary,
                  ),
                ),
              ),

              const SizedBox(height: 28),

              // Title
              const Text(
                'Location Access\nRequired',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textDark,
                  height: 1.3,
                ),
              ),

              const SizedBox(height: 16),

              const Text(
                'To use RWATRACK, we need access to your location to verify your work presence and ensure accurate attendance records.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textMid,
                  height: 1.6,
                ),
              ),

              const SizedBox(height: 28),

              // Consent box
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'By tapping "Allow", you agree to:',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textDark,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...[
                      'Share your GPS location while using the app',
                      'Allow background location updates for work verification',
                      'Have your location recorded every 5 minutes',
                      'Your data is used only for work-related purposes',
                    ].map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.check_circle_outline,
                              size: 18,
                              color: AppTheme.success,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                item,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.textMid,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Warning
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
                ),
                child: const Text(
                  'If you deny location access, you will not be able to use this system as location data is essential for its functionality.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.error,
                    height: 1.5,
                  ),
                ),
              ),

              const SizedBox(height: 12),

              const Text(
                'We are committed to using your data responsibly and only for work-related purposes.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  color: AppTheme.textLight,
                  height: 1.5,
                ),
              ),

              const SizedBox(height: 32),

              // Allow button
              ElevatedButton(
                onPressed: _loading ? null : _handleAllow,
                child: _loading
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2.5,
                        ),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.location_on_rounded, size: 20),
                          SizedBox(width: 8),
                          Text('Allow Location Access'),
                        ],
                      ),
              ),

              const SizedBox(height: 12),

              // Deny button
              OutlinedButton(
                onPressed: _loading ? null : _handleDeny,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  side: const BorderSide(color: AppTheme.border),
                ),
                child: const Text(
                  'Deny',
                  style: TextStyle(color: AppTheme.textMid),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}