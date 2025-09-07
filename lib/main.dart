import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'providers/auth_provider.dart';
import 'providers/student_provider.dart';
import 'providers/finance_provider.dart';
import 'providers/attendance_provider.dart';
import 'providers/payment_provider.dart';
import 'providers/class_provider.dart';
import 'providers/points_provider.dart';
import 'screens/splash_screen.dart';
import 'services/pocketbase_service.dart';
import 'services/network_service.dart';
import 'services/realtime_service.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize shared preferences
  final prefs = await SharedPreferences.getInstance();
  
  // Initialize network monitoring
  NetworkService.instance.startListening();
  
  runApp(MyApp(prefs: prefs));
}

class MyApp extends StatelessWidget {
  final SharedPreferences prefs;
  
  const MyApp({super.key, required this.prefs});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => PocketBaseService.instance),
        ChangeNotifierProvider(create: (_) => NetworkService.instance),
        ChangeNotifierProvider(create: (_) => RealtimeService.instance),
        ChangeNotifierProvider(create: (context) => AuthProvider(prefs)),
        ChangeNotifierProxyProvider<PocketBaseService, StudentProvider>(
          create: (context) => StudentProvider(pocketBaseService: context.read<PocketBaseService>()),
          update: (context, pocketBaseService, previous) => 
              previous ?? StudentProvider(pocketBaseService: pocketBaseService),
        ),
        ChangeNotifierProvider(create: (_) => FinanceProvider()),
        ChangeNotifierProxyProvider<PocketBaseService, AttendanceProvider>(
          create: (context) => AttendanceProvider(pocketBaseService: context.read<PocketBaseService>()),
          update: (context, pocketBaseService, previous) => 
              previous ?? AttendanceProvider(pocketBaseService: pocketBaseService),
        ),
        ChangeNotifierProvider(create: (_) => PaymentProvider()),
        ChangeNotifierProvider(create: (_) => ClassProvider()),
        ChangeNotifierProvider(create: (_) => PointsProvider()),
      ],
      child: MaterialApp(
        title: 'PJPC School Management',
        theme: AppTheme.lightTheme,
        themeMode: ThemeMode.light,
        home: const SplashScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}