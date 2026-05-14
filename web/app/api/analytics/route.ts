import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // === USER STATS ===
    const totalUsers = await prisma.user.count();
    const totalWorkers = await prisma.user.count({ where: { role: "WORKER" } });
    const totalHR = await prisma.user.count({ where: { role: "HR" } });
    const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
    const activeUsers = await prisma.user.count({ where: { status: "ACTIVE" } });
    const inactiveUsers = await prisma.user.count({ where: { status: "INACTIVE" } });
    const suspendedUsers = await prisma.user.count({ where: { status: "SUSPENDED" } });

    // === WORKERS WITH GPS ===
    const workersWithGPS = await prisma.worker.count({
      where: { homeLat: { not: null } },
    });

    // === REGISTRATION TRENDS (last 6 months) ===
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, role: true },
    });

    const monthlyRegistrations: Record<string, { workers: number; hr: number; total: number }> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    recentUsers.forEach((u) => {
      const d = new Date(u.createdAt);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthlyRegistrations[key]) monthlyRegistrations[key] = { workers: 0, hr: 0, total: 0 };
      monthlyRegistrations[key].total++;
      if (u.role === "WORKER") monthlyRegistrations[key].workers++;
      if (u.role === "HR") monthlyRegistrations[key].hr++;
    });

    // === ATTENDANCE STATS (last 7 days) ===
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const todayStr = new Date().toISOString().split("T")[0];

    const recentAttendance = await prisma.attendance.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { date: true, status: true },
    });

    const dailyAttendance: Record<string, { present: number; late: number; absent: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyAttendance[key] = { present: 0, late: 0, absent: 0 };
    }

    recentAttendance.forEach((a) => {
      if (dailyAttendance[a.date]) {
        if (a.status === "PRESENT") dailyAttendance[a.date].present++;
        else if (a.status === "LATE") dailyAttendance[a.date].late++;
        else dailyAttendance[a.date].absent++;
      }
    });

    // Today's attendance
    const todayAttendance = await prisma.attendance.findMany({
      where: { date: todayStr },
      select: { status: true },
    });
    const todayPresent = todayAttendance.filter((a) => a.status === "PRESENT").length;
    const todayLate = todayAttendance.filter((a) => a.status === "LATE").length;
    const todayAbsent = totalWorkers - todayPresent - todayLate;

    // === DEPARTMENT DISTRIBUTION ===
    const departments = await prisma.user.groupBy({
      by: ["institution", "department"],
      where: { role: "WORKER", status: "ACTIVE" },
      _count: true,
    });

    const deptDistribution = departments
      .filter((d) => d.institution && d.department)
      .map((d) => ({
        institution: d.institution,
        department: d.department,
        count: d._count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // === DISTRICT DISTRIBUTION (from addresses) ===
    const workers = await prisma.worker.findMany({
      where: { homeAddress: { not: null } },
      select: { homeAddress: true },
    });

    const districtCounts: Record<string, number> = {};
    workers.forEach((w) => {
      if (w.homeAddress) {
        // Try to extract district from address
        const parts = w.homeAddress.split(",").map((s) => s.trim());
        const district = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
        if (district) {
          districtCounts[district] = (districtCounts[district] || 0) + 1;
        }
      }
    });

    const districtDistribution = Object.entries(districtCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // === RECENT ACTIVITY ===
    const recentLogs = await prisma.auditLog.findMany({
      include: { user: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // === MESSAGES STATS ===
    const totalMessages = await prisma.message.count();
    const totalTickets = await prisma.supportTicket.count();
    const openTickets = await prisma.supportTicket.count({ where: { status: "OPEN" } });

    // === LOCATION LOGS (activity) ===
    const totalLocationLogs = await prisma.locationLog.count();
    const recentLocationLogs = await prisma.locationLog.count({
      where: { recordedAt: { gte: sevenDaysAgo } },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        workers: totalWorkers,
        hr: totalHR,
        admins: totalAdmins,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        withGPS: workersWithGPS,
      },
      attendance: {
        today: { present: todayPresent, late: todayLate, absent: todayAbsent },
        daily: Object.entries(dailyAttendance).map(([date, data]) => ({ date, ...data })),
      },
      registrations: Object.entries(monthlyRegistrations).map(([month, data]) => ({ month, ...data })),
      departments: deptDistribution,
      districts: districtDistribution,
      activity: {
        totalMessages,
        totalTickets,
        openTickets,
        totalLocationLogs,
        recentLocationLogs,
      },
      recentLogs: recentLogs.map((l) => ({
        action: l.action,
        details: l.details,
        user: `${l.user?.firstName} ${l.user?.lastName}`,
        role: l.user?.role,
        time: l.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
