import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  bool _isLoading = false;
  String? _errorMessage;
  Map<String, dynamic>? _user;
  bool _isPendingApproval = false;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isPendingApproval => _isPendingApproval;

  Future<bool> login(String email, String password, {String? role}) async {
    _isLoading = true;
    _errorMessage = null;
    _isPendingApproval = false;
    notifyListeners();

    try {
      final result = await ApiService.login(email, password, role: role);

      if (result['success'] == true) {
        final data = result['data'] as Map<String, dynamic>;
        _user = data['user'];
        await ApiService.saveToken(data['token']);
        await ApiService.saveUser(_user!);
        return true;
      } else {
        _errorMessage = result['error'] as String?;
        _isPendingApproval = result['pending'] == true;
        return false;
      }
    } catch (e) {
      _errorMessage = 'Connection failed. Please check your network.';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await ApiService.logout();
    _user = null;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    final loggedIn = await ApiService.isLoggedIn();
    if (loggedIn) {
      _user = await ApiService.getUser();
    } else {
      _user = null;
    }
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}