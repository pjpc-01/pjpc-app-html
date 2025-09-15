import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import 'admin_profile_screen.dart';
import 'teacher_profile_screen.dart';
import 'student_profile_screen.dart';
import 'parent_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // 根据用户角色显示不同的个人页面
        if (authProvider.isAdmin) {
          return const AdminProfileScreen();
        } else if (authProvider.isTeacher) {
          return const TeacherProfileScreen();
        } else if (authProvider.isParent) {
          return const ParentProfileScreen();
        } else {
          // 默认显示学生个人页面
          return const StudentProfileScreen();
        }
      },
    );
  }
}
