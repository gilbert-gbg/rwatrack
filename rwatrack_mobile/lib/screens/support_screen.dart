import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});
  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  List<dynamic> _tickets = [];
  bool _loading = true;
  bool _sending = false;
  final _subjectCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();

  @override
  void initState() { super.initState(); _loadTickets(); }

  Future<void> _loadTickets() async {
    try {
      final t = await ApiService.getToken();
      final r = await http.get(Uri.parse('${ApiService.baseUrl}/api/support'),
        headers: {'Content-Type': 'application/json', if (t != null) 'Authorization': 'Bearer $t'});
      if (r.statusCode == 200) _tickets = jsonDecode(r.body);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _submit() async {
    if (_subjectCtrl.text.trim().isEmpty || _messageCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Subject and message are required'), backgroundColor: Color(0xFFEF4444)));
      return;
    }
    setState(() => _sending = true);
    try {
      final t = await ApiService.getToken();
      final r = await http.post(Uri.parse('${ApiService.baseUrl}/api/support'),
        headers: {'Content-Type': 'application/json', if (t != null) 'Authorization': 'Bearer $t'},
        body: jsonEncode({'subject': _subjectCtrl.text.trim(), 'message': _messageCtrl.text.trim()}));
      if (r.statusCode == 200) {
        _subjectCtrl.clear(); _messageCtrl.clear();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request submitted! Admin will respond.'), backgroundColor: Color(0xFF22C55E)));
        _loadTickets();
      }
    } catch (_) {}
    setState(() => _sending = false);
  }

  Color _statusColor(String s) {
    if (s == 'RESOLVED') return const Color(0xFF22C55E);
    if (s == 'IN_PROGRESS') return const Color(0xFF3B82F6);
    return const Color(0xFFF59E0B);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & Support'), elevation: 0.5),
      body: _loading ? const Center(child: CircularProgressIndicator()) : SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(children: [
              Icon(Icons.help_outline_rounded, color: Colors.white, size: 32),
              SizedBox(width: 12),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Need Help?', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                Text('Submit a request and admin will respond', style: TextStyle(color: Colors.white70, fontSize: 12)),
              ]),
            ]),
          ),

          const SizedBox(height: 20),

          // Submit form
          const Text('New Request', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),

          TextField(
            controller: _subjectCtrl,
            decoration: InputDecoration(
              hintText: 'Subject — What do you need help with?',
              prefixIcon: const Icon(Icons.subject_rounded, size: 18),
              filled: true, fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2)),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _messageCtrl,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Describe your issue or question...',
              filled: true, fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: _sending ? null : _submit,
            icon: _sending ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.send_rounded, size: 18),
            label: Text(_sending ? 'Submitting...' : 'Submit Request'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          )),

          const SizedBox(height: 24),

          // My tickets
          Text('My Requests (${_tickets.length})', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),

          if (_tickets.isEmpty)
            Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(children: [
              Icon(Icons.inbox_rounded, size: 48, color: Colors.grey[300]),
              const SizedBox(height: 8),
              Text('No requests yet', style: TextStyle(color: Colors.grey[500])),
            ])))
          else
            ..._tickets.map((t) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white, borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(t['subject'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: _statusColor(t['status'] ?? 'OPEN').withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                    child: Text(t['status'] ?? 'OPEN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _statusColor(t['status'] ?? 'OPEN'))),
                  ),
                ]),
                const SizedBox(height: 6),
                Text(t['message'] ?? '', style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                const SizedBox(height: 4),
                Text(DateTime.tryParse(t['createdAt'] ?? '')?.toLocal().toString().substring(0, 16) ?? '',
                  style: TextStyle(fontSize: 10, color: Colors.grey[400])),
                if (t['response'] != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(10)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Row(children: [
                        Icon(Icons.check_circle, size: 14, color: Color(0xFF22C55E)),
                        SizedBox(width: 4),
                        Text('Admin Response', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF166534))),
                      ]),
                      const SizedBox(height: 4),
                      Text(t['response'], style: const TextStyle(fontSize: 13, color: Color(0xFF166534))),
                    ]),
                  ),
                ],
              ]),
            )),
        ]),
      ),
    );
  }

  @override
  void dispose() { _subjectCtrl.dispose(); _messageCtrl.dispose(); super.dispose(); }
}
