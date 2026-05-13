import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  bool _loading = true;
  bool _editing = false;
  bool _saving = false;
  String? _avatarBase64;

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _bioController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final token = await ApiService.getToken();
      final res = await http.get(
        Uri.parse('${ApiService.baseUrl}/api/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _user = data;
            _firstNameController.text = data['firstName'] ?? '';
            _lastNameController.text = data['lastName'] ?? '';
            _phoneController.text = data['phone'] ?? '';
            _bioController.text = data['bio'] ?? '';
            _avatarBase64 = data['avatar'];
            _loading = false;
          });
        }
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _saving = true);
    try {
      final token = await ApiService.getToken();
      final res = await http.put(
        Uri.parse('${ApiService.baseUrl}/api/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'firstName': _firstNameController.text,
          'lastName': _lastNameController.text,
          'phone': _phoneController.text,
          'bio': _bioController.text,
          'avatar': _avatarBase64,
        }),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() { _user = data; _editing = false; });
        // Update saved user
        await ApiService.saveUser({
          'id': data['id'],
          'email': data['email'],
          'firstName': data['firstName'],
          'lastName': data['lastName'],
          'role': data['role'],
          'phone': data['phone'],
          'avatar': data['avatar'],
          'bio': data['bio'],
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile updated!'), backgroundColor: Color(0xFF22C55E)),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to update profile'), backgroundColor: Color(0xFFEF4444)),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Connection error'), backgroundColor: Color(0xFFEF4444)),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F9FF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: const Color(0xFF3B82F6).withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: const Color(0xFF3B82F6)),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
        ])),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFFEFF6FF),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final initials = '${_user?['firstName']?[0] ?? ''}${_user?['lastName']?[0] ?? ''}'.toUpperCase();

    return Scaffold(
      backgroundColor: const Color(0xFFEFF6FF),
      body: CustomScrollView(
        slivers: [
          // App Bar with cover
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: const Color(0xFF3B82F6),
            iconTheme: const IconThemeData(color: Colors.white),
            actions: [
              TextButton.icon(
                onPressed: () => setState(() => _editing = !_editing),
                icon: Icon(_editing ? Icons.close : Icons.edit, size: 18, color: Colors.white),
                label: Text(_editing ? 'Cancel' : 'Edit', style: const TextStyle(color: Colors.white)),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8), Color(0xFF4338CA)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                ),
                child: Stack(children: [
                  Positioned(top: -30, right: -30, child: Container(width: 150, height: 150, decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(75)))),
                  Positioned(bottom: -20, left: -20, child: Container(width: 100, height: 100, decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(50)))),
                ]),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                // Avatar + Name
                Transform.translate(
                  offset: const Offset(0, -50),
                  child: Column(children: [
                    // Avatar
                    Container(
                      width: 100, height: 100,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.white, width: 4),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 20, offset: const Offset(0, 8))],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: _avatarBase64 != null && _avatarBase64!.startsWith('data:')
                            ? Image.memory(
                                base64Decode(_avatarBase64!.split(',').last),
                                fit: BoxFit.cover, width: 100, height: 100,
                              )
                            : Container(
                                color: const Color(0xFF3B82F6),
                                child: Center(child: Text(initials, style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Colors.white))),
                              ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('${_user?['firstName']} ${_user?['lastName']}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                    const SizedBox(height: 4),
                    Text(_user?['email'] ?? '', style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
                    if (_user?['bio'] != null && !_editing) ...[
                      const SizedBox(height: 6),
                      Text('"${_user!['bio']}"', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontStyle: FontStyle.italic)),
                    ],
                    const SizedBox(height: 8),
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: _user?['status'] == 'ACTIVE' ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(_user?['status'] ?? '', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _user?['status'] == 'ACTIVE' ? const Color(0xFF166534) : const Color(0xFF92400E))),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFFDBEAFE), borderRadius: BorderRadius.circular(20)),
                        child: Text(_user?['role'] ?? '', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF1E40AF))),
                      ),
                    ]),
                  ]),
                ),

                // Edit mode
                if (_editing) ...[
                  _buildEditField('First Name', _firstNameController, Icons.person_rounded),
                  _buildEditField('Last Name', _lastNameController, Icons.person_rounded),
                  _buildEditField('Phone', _phoneController, Icons.phone_rounded, keyboardType: TextInputType.phone),
                  _buildEditField('Bio', _bioController, Icons.edit_rounded, maxLines: 3),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _saving ? null : _saveProfile,
                      icon: _saving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.save_rounded, size: 18),
                      label: Text(_saving ? 'Saving...' : 'Save Changes'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ] else ...[
                  // View mode
                  _buildInfoTile(Icons.person_rounded, 'Full Name', '${_user?['firstName']} ${_user?['lastName']}'),
                  _buildInfoTile(Icons.email_rounded, 'Email', _user?['email'] ?? '—'),
                  _buildInfoTile(Icons.phone_rounded, 'Phone', _user?['phone'] ?? 'Not provided'),
                  _buildInfoTile(Icons.shield_rounded, 'Role', _user?['role'] ?? '—'),
                  _buildInfoTile(Icons.calendar_today_rounded, 'Member Since',
                    _user?['createdAt'] != null
                      ? DateTime.parse(_user!['createdAt']).toLocal().toString().substring(0, 10)
                      : '—'
                  ),
                  if (_user?['worker'] != null) ...[
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text('Worker Info', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                    ),
                    _buildInfoTile(Icons.work_rounded, 'Job Title', _user!['worker']['jobTitle'] ?? 'Not set'),
                    _buildInfoTile(Icons.home_rounded, 'Home Address', _user!['worker']['homeAddress'] ?? 'Not set'),
                    _buildInfoTile(Icons.business_rounded, 'Work Address', _user!['worker']['workAddress'] ?? 'Not set'),
                  ],
                ],

                // Change Password
                Container(
                  margin: const EdgeInsets.only(top: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: ListTile(
                    leading: Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(color: const Color(0xFFFEE2E2), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.lock_rounded, size: 18, color: Color(0xFFEF4444)),
                    ),
                    title: const Text('Change Password', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Update your login credentials', style: TextStyle(fontSize: 12)),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChangePasswordScreen())),
                  ),
                ),

                const SizedBox(height: 40),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditField(String label, TextEditingController controller, IconData icon, {TextInputType? keyboardType, int maxLines = 1}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 18, color: const Color(0xFF94A3B8)),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2)),
          ),
        ),
      ]),
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    super.dispose();
  }
}

// ─── CHANGE PASSWORD SCREEN ──────────────────────────────

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _loading = false;
  bool _showPasswords = false;
  bool _success = false;
  String? _error;

  Future<void> _changePassword() async {
    setState(() { _error = null; });

    if (_currentController.text.isEmpty) { setState(() => _error = 'Enter current password'); return; }
    if (_newController.text.length < 6) { setState(() => _error = 'New password must be at least 6 characters'); return; }
    if (_newController.text != _confirmController.text) { setState(() => _error = 'Passwords do not match'); return; }

    setState(() => _loading = true);
    try {
      final token = await ApiService.getToken();
      final res = await http.put(
        Uri.parse('${ApiService.baseUrl}/api/auth/password'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'currentPassword': _currentController.text,
          'newPassword': _newController.text,
          'confirmPassword': _confirmController.text,
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        setState(() => _success = true);
      } else {
        setState(() => _error = data['error'] ?? 'Failed to change password');
      }
    } catch (_) {
      setState(() => _error = 'Connection error');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEFF6FF),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text('Change Password', style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w700)),
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: _success
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const SizedBox(height: 60),
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(40)),
                  child: const Icon(Icons.check_circle_rounded, size: 48, color: Color(0xFF22C55E)),
                ),
                const SizedBox(height: 16),
                const Text('Password Changed!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text('Your password has been updated', style: TextStyle(color: Color(0xFF94A3B8))),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), foregroundColor: Colors.white, minimumSize: const Size(200, 48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Back to Profile'),
                ),
              ]))
            : Column(children: [
                if (_error != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFFFEE2E2), borderRadius: BorderRadius.circular(12)),
                    child: Row(children: [
                      const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13))),
                    ]),
                  ),

                _passwordField('Current Password', _currentController),
                _passwordField('New Password', _newController),
                _passwordField('Confirm New Password', _confirmController),

                const SizedBox(height: 8),
                Row(children: [
                  Switch(value: _showPasswords, onChanged: (v) => setState(() => _showPasswords = v), activeThumbColor: const Color(0xFF3B82F6)),
                  const Text('Show passwords', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                ]),

                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _changePassword,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: _loading
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                        : const Text('Change Password', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ]),
      ),
    );
  }

  Widget _passwordField(String label, TextEditingController controller) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: !_showPasswords,
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.lock_outline_rounded, size: 18, color: Color(0xFF94A3B8)),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2)),
          ),
        ),
      ]),
    );
  }

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }
}
