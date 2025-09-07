import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class SkeletonLoader extends StatelessWidget {
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final EdgeInsets? margin;
  final Color? baseColor;
  final Color? highlightColor;

  const SkeletonLoader({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
    this.margin,
    this.baseColor,
    this.highlightColor,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: baseColor ?? Colors.grey[300]!,
      highlightColor: highlightColor ?? Colors.grey[100]!,
      child: Container(
        width: width,
        height: height ?? 20,
        margin: margin,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: borderRadius ?? BorderRadius.circular(8),
        ),
      ),
    );
  }
}

class StudentCardSkeleton extends StatelessWidget {
  const StudentCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                SkeletonLoader(
                  width: 50,
                  height: 50,
                  borderRadius: BorderRadius.circular(25),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonLoader(width: 120, height: 16),
                      const SizedBox(height: 8),
                      SkeletonLoader(width: 80, height: 14),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SkeletonLoader(width: double.infinity, height: 12),
            const SizedBox(height: 8),
            SkeletonLoader(width: 200, height: 12),
          ],
        ),
      ),
    );
  }
}

class AttendanceCardSkeleton extends StatelessWidget {
  const AttendanceCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                SkeletonLoader(width: 100, height: 16),
                SkeletonLoader(width: 60, height: 14),
              ],
            ),
            const SizedBox(height: 12),
            SkeletonLoader(width: double.infinity, height: 12),
            const SizedBox(height: 8),
            SkeletonLoader(width: 150, height: 12),
            const SizedBox(height: 16),
            Row(
              children: [
                SkeletonLoader(width: 80, height: 32, borderRadius: BorderRadius.circular(16)),
                const SizedBox(width: 8),
                SkeletonLoader(width: 80, height: 32, borderRadius: BorderRadius.circular(16)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class InvoiceCardSkeleton extends StatelessWidget {
  const InvoiceCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                SkeletonLoader(width: 120, height: 16),
                SkeletonLoader(width: 60, height: 14),
              ],
            ),
            const SizedBox(height: 12),
            SkeletonLoader(width: double.infinity, height: 12),
            const SizedBox(height: 8),
            SkeletonLoader(width: 100, height: 12),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                SkeletonLoader(width: 80, height: 20),
                SkeletonLoader(width: 60, height: 32, borderRadius: BorderRadius.circular(16)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class DashboardStatsSkeleton extends StatelessWidget {
  const DashboardStatsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.5,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: 4,
      itemBuilder: (context, index) {
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLoader(width: 40, height: 40, borderRadius: BorderRadius.circular(20)),
                const SizedBox(height: 12),
                SkeletonLoader(width: 80, height: 16),
                const SizedBox(height: 8),
                SkeletonLoader(width: 60, height: 14),
              ],
            ),
          ),
        );
      },
    );
  }
}

class ListSkeleton extends StatelessWidget {
  final int itemCount;
  final Widget Function(BuildContext, int) itemBuilder;

  const ListSkeleton({
    super.key,
    this.itemCount = 5,
    required this.itemBuilder,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: itemCount,
      itemBuilder: itemBuilder,
    );
  }
}

class StudentListSkeleton extends StatelessWidget {
  final int itemCount;

  const StudentListSkeleton({
    super.key,
    this.itemCount = 5,
  });

  @override
  Widget build(BuildContext context) {
    return ListSkeleton(
      itemCount: itemCount,
      itemBuilder: (context, index) => const StudentCardSkeleton(),
    );
  }
}

class AttendanceListSkeleton extends StatelessWidget {
  final int itemCount;

  const AttendanceListSkeleton({
    super.key,
    this.itemCount = 5,
  });

  @override
  Widget build(BuildContext context) {
    return ListSkeleton(
      itemCount: itemCount,
      itemBuilder: (context, index) => const AttendanceCardSkeleton(),
    );
  }
}

class InvoiceListSkeleton extends StatelessWidget {
  final int itemCount;

  const InvoiceListSkeleton({
    super.key,
    this.itemCount = 5,
  });

  @override
  Widget build(BuildContext context) {
    return ListSkeleton(
      itemCount: itemCount,
      itemBuilder: (context, index) => const InvoiceCardSkeleton(),
    );
  }
}
