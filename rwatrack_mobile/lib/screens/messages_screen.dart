import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});
  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<dynamic> _conversations = [];
  List<dynamic> _broadcasts = [];
  Map<String, dynamic>? _currentUser;
  bool _loading = true;

  @override
  void initState() { super.initState(); _loadData(); }

  Future<Map<String, String>> _h() async {
    final t = await ApiService.getToken();
    return {'Content-Type': 'application/json', if (t != null) 'Authorization': 'Bearer $t'};
  }

  Future<void> _loadData() async {
    try {
      final h = await _h();
      final userRes = await http.get(Uri.parse('${ApiService.baseUrl}/api/auth/me'), headers: h);
      final msgRes = await http.get(Uri.parse('${ApiService.baseUrl}/api/messages'), headers: h);
      if (userRes.statusCode == 200) _currentUser = jsonDecode(userRes.body);
      if (msgRes.statusCode == 200) {
        final d = jsonDecode(msgRes.body);
        _conversations = d['conversations'] ?? [];
        _broadcasts = d['broadcasts'] ?? [];
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  String _timeAgo(String s) {
    try {
      final d = DateTime.now().difference(DateTime.parse(s));
      if (d.inMinutes < 1) return 'Now';
      if (d.inMinutes < 60) return '${d.inMinutes}m';
      if (d.inHours < 24) return '${d.inHours}h';
      return '${d.inDays}d';
    } catch (_) { return ''; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Messages'), elevation: 0.5),
      body: _loading ? const Center(child: CircularProgressIndicator()) : RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          if (_broadcasts.isNotEmpty) ...[
            const Padding(padding: EdgeInsets.only(bottom: 8), child: Text('📢 Broadcasts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFFF59E0B)))),
            ..._broadcasts.map((b) => Container(
              margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFDE68A))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text('${b['sender']?['firstName'] ?? ''} ${b['sender']?['lastName'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  const Spacer(),
                  Text(_timeAgo(b['createdAt'] ?? ''), style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                ]),
                const SizedBox(height: 4),
                Text(b['content'] ?? '', style: const TextStyle(fontSize: 13)),
              ]),
            )),
            const SizedBox(height: 16),
          ],
          const Padding(padding: EdgeInsets.only(bottom: 8), child: Text('💬 Conversations', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF3B82F6)))),
          if (_conversations.isEmpty)
            Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(children: [
              Icon(Icons.message_outlined, size: 48, color: Colors.grey[300]),
              const SizedBox(height: 12),
              Text('No conversations yet', style: TextStyle(color: Colors.grey[500], fontWeight: FontWeight.w600)),
              Text('Messages from HR will appear here', style: TextStyle(fontSize: 12, color: Colors.grey[400])),
            ])))
          else
            ..._conversations.map((c) {
              final u = c['user'];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFBFDBFE))),
                child: ListTile(
                  leading: CircleAvatar(backgroundColor: const Color(0xFF3B82F6).withOpacity(0.1),
                    child: Text('${u?['firstName']?[0] ?? ''}${u?['lastName']?[0] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF3B82F6)))),
                  title: Text('${u?['firstName'] ?? ''} ${u?['lastName'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: Text(c['lastMessage'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                  trailing: c['unread'] != null && c['unread'] > 0
                    ? Container(width: 22, height: 22, decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                        child: Center(child: Text('${c['unread']}', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold))))
                    : null,
                  onTap: () async {
                    await Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(
                      contactId: u?['id'] ?? '', contactName: '${u?['firstName'] ?? ''} ${u?['lastName'] ?? ''}',
                      contactRole: u?['role'] ?? '', currentUserId: _currentUser?['id'] ?? '')));
                    _loadData();
                  },
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              );
            }),
        ]),
      ),
    );
  }
}

class ChatScreen extends StatefulWidget {
  final String contactId, contactName, contactRole, currentUserId;
  const ChatScreen({super.key, required this.contactId, required this.contactName, required this.contactRole, required this.currentUserId});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  List<dynamic> _msgs = [];
  bool _loading = true, _sending = false;
  Timer? _timer;

  @override
  void initState() { super.initState(); _load(); _timer = Timer.periodic(const Duration(seconds: 5), (_) => _load()); }
  @override
  void dispose() { _timer?.cancel(); _ctrl.dispose(); _scroll.dispose(); super.dispose(); }

  Future<void> _load() async {
    try {
      final t = await ApiService.getToken();
      final r = await http.get(Uri.parse('${ApiService.baseUrl}/api/messages?chatWith=${widget.contactId}'),
        headers: {'Content-Type': 'application/json', if (t != null) 'Authorization': 'Bearer $t'}).timeout(const Duration(seconds: 8));
      if (r.statusCode == 200) {
        final d = jsonDecode(r.body);
        if (mounted) { setState(() { _msgs = d['messages'] ?? []; _loading = false; }); _scrollEnd(); }
      }
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _scrollEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    });
  }

  Future<void> _send() async {
    final txt = _ctrl.text.trim(); if (txt.isEmpty) return;
    setState(() => _sending = true); _ctrl.clear();
    try {
      final t = await ApiService.getToken();
      final r = await http.post(Uri.parse('${ApiService.baseUrl}/api/messages'),
        headers: {'Content-Type': 'application/json', if (t != null) 'Authorization': 'Bearer $t'},
        body: jsonEncode({'receiverId': widget.contactId, 'content': txt})).timeout(const Duration(seconds: 8));
      if (r.statusCode == 200) { setState(() => _msgs.add(jsonDecode(r.body))); _scrollEnd(); }
    } catch (_) {}
    setState(() => _sending = false);
  }

  @override
  Widget build(BuildContext context) {
    final initials = widget.contactName.split(' ').map((e) => e.isNotEmpty ? e[0] : '').join();
    return Scaffold(
      appBar: AppBar(elevation: 0.5, title: Row(children: [
        CircleAvatar(radius: 16, backgroundColor: const Color(0xFF3B82F6),
          child: Text(initials, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold))),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(widget.contactName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          Text(widget.contactRole, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
        ]),
      ])),
      body: Column(children: [
        Expanded(child: _loading ? const Center(child: CircularProgressIndicator())
          : _msgs.isEmpty ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.chat_bubble_outline, size: 48, color: Colors.grey[300]), const SizedBox(height: 12),
              Text('No messages yet', style: TextStyle(color: Colors.grey[500])),
              Text('Say hello! 👋', style: TextStyle(fontSize: 12, color: Colors.grey[400])),
            ]))
          : ListView.builder(controller: _scroll, padding: const EdgeInsets.all(16), itemCount: _msgs.length, itemBuilder: (c, i) {
              final m = _msgs[i]; final isMe = m['senderId'] == widget.currentUserId;
              return Align(alignment: isMe ? Alignment.centerRight : Alignment.centerLeft, child: Container(
                margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
                decoration: BoxDecoration(color: isMe ? const Color(0xFF3B82F6) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.only(topLeft: const Radius.circular(16), topRight: const Radius.circular(16),
                    bottomLeft: Radius.circular(isMe ? 16 : 4), bottomRight: Radius.circular(isMe ? 4 : 16))),
                child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text(m['content'] ?? '', style: TextStyle(fontSize: 14, color: isMe ? Colors.white : const Color(0xFF1E293B))),
                  const SizedBox(height: 3),
                  Text(_fmt(m['createdAt'] ?? ''), style: TextStyle(fontSize: 10, color: isMe ? Colors.white60 : const Color(0xFF94A3B8))),
                ]),
              ));
            })),
        Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(border: const Border(top: BorderSide(color: Color(0xFFE2E8F0)))),
          child: Row(children: [
            Expanded(child: TextField(controller: _ctrl, textInputAction: TextInputAction.send, onSubmitted: (_) => _send(),
              decoration: InputDecoration(hintText: 'Type a message...', hintStyle: const TextStyle(fontSize: 14), filled: true, fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: const BorderSide(color: Color(0xFFBFDBFE))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2))))),
            const SizedBox(width: 8),
            Container(decoration: const BoxDecoration(color: Color(0xFF3B82F6), shape: BoxShape.circle),
              child: IconButton(onPressed: _sending ? null : _send,
                icon: _sending ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.send_rounded, color: Colors.white, size: 20))),
          ]),
        ),
      ]),
    );
  }
  String _fmt(String s) { try { final d = DateTime.parse(s).toLocal(); return '${d.hour.toString().padLeft(2,'0')}:${d.minute.toString().padLeft(2,'0')}'; } catch(_) { return ''; } }
}
