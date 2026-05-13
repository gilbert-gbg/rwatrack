import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:rwatrack_mobile/screens/login_screen.dart';
import 'package:rwatrack_mobile/screens/location_permission_screen.dart';
import 'package:rwatrack_mobile/services/auth_provider.dart';

void main() {
  testWidgets('Login screen renders form fields and submit button', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.text('Sign In'), findsNWidgets(2)); // Title and button
    expect(find.text('Email Address'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.widgetWithIcon(ElevatedButton, Icons.arrow_forward_rounded), findsOneWidget);

    await tester.enterText(find.byType(TextFormField).first, 'worker@example.com');
    await tester.enterText(find.byType(TextFormField).last, 'password123');

    await tester.tap(find.widgetWithText(ElevatedButton, 'Sign In'));
    await tester.pump();

    expect(find.text('Email is required'), findsNothing);
    expect(find.text('Password is required'), findsNothing);
  });

  testWidgets('Location permission screen shows allow and deny actions', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: LocationPermissionScreen()));

    expect(find.text('Location Access\nRequired'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Allow Location Access'), findsOneWidget);
    expect(find.widgetWithText(OutlinedButton, 'Deny'), findsOneWidget);
    expect(find.textContaining('location data is essential'), findsOneWidget);
  });
}
