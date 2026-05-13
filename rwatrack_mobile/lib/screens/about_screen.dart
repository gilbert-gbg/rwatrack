import 'package:flutter/material.dart';
import '../config/app_config.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(title: const Text('About RWATRACK'), elevation: 0.5),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          Container(width: 90, height: 90,
            decoration: BoxDecoration(color: const Color(0xFF3B82F6), borderRadius: BorderRadius.circular(22),
              boxShadow: [BoxShadow(color: const Color(0xFF3B82F6).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8))]),
            child: const Icon(Icons.location_on_rounded, size: 48, color: Colors.white)),
          const SizedBox(height: 16),
          const Text('RWATRACK', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 2)),
          const SizedBox(height: 4),
          Text('Version ${AppConfig.appVersion}', style: TextStyle(fontSize: 13, color: Colors.grey[500])),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(color: const Color(0xFF3B82F6).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
            child: const Text('AI-Driven Workforce Management', style: TextStyle(fontSize: 12, color: Color(0xFF3B82F6), fontWeight: FontWeight.w600))),
          const SizedBox(height: 32),
          _s(Icons.info_outline_rounded, 'About', 'RWATRACK is an AI-driven government employee residence tracking system designed for Rwanda. It combines GPS tracking with machine learning to verify, monitor, and predict employee residence patterns.', isDark),
          _s(Icons.school_rounded, 'University Project', 'Final Year Project submitted to the University of Rwanda, School of ICT, Department of Information Systems, for BSc with Honours in Information Systems. May 2026.', isDark),
          _s(Icons.people_rounded, 'Developed By', '• BIZIRUGIRA Gilbert (222005932)\n• ABAYISENGA Josiane (222003434)', isDark),
          _s(Icons.person_rounded, 'Supervised By', 'Dr. RWIGEMA James', isDark),
          _s(Icons.star_rounded, 'Key Features', '• 3 AI Models (90-98% accuracy)\n• Real-time GPS Tracking\n• Role-based Dashboards (Admin, HR, Worker)\n• Interactive Worker Map\n• Messaging & Chat System\n• Help & Support Tickets\n• Notification System\n• Profile with Image Upload\n• Dark Mode\n• Export PDF/CSV\n• Department-based HR Assignment\n• Approval Workflows\n• Audit Logging', isDark),
          _s(Icons.code_rounded, 'Technology Stack', '• Frontend: Next.js 15, React 19, Tailwind CSS\n• Mobile: Flutter 3.41, Dart 3.11\n• AI: Python, scikit-learn, Flask\n• Database: MongoDB Atlas\n• Auth: JWT, bcrypt\n• Maps: Leaflet (web), Geolocator (mobile)\n• Charts: Recharts', isDark),
          _s(Icons.psychology_rounded, 'AI Models', '• Random Forest — Address Classification (90.5%)\n• Isolation Forest — Anomaly Detection (94.4%)\n• Logistic Regression — Relocation Prediction (98.5% AUC)', isDark),
          const SizedBox(height: 20),
          Text('© ${DateTime.now().year} RWATRACK', style: TextStyle(fontSize: 12, color: Colors.grey[400])),
          Text('University of Rwanda • School of ICT', style: TextStyle(fontSize: 11, color: Colors.grey[400])),
          const SizedBox(height: 8),
          Text('Made with ❤️ in Rwanda 🇷🇼', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
          const SizedBox(height: 30),
        ]),
      ),
    );
  }

  Widget _s(IconData icon, String title, String content, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14), padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFBFDBFE))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 36, height: 36,
            decoration: BoxDecoration(color: const Color(0xFF3B82F6).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 18, color: const Color(0xFF3B82F6))),
          const SizedBox(width: 10),
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 10),
        Text(content, style: TextStyle(fontSize: 13, height: 1.6, color: isDark ? Colors.grey[400] : Colors.grey[600])),
      ]),
    );
  }
}
