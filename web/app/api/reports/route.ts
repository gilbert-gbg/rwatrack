import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth || !["HR", "ADMIN"].includes(auth.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "summary";
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59Z"),
      },
    } : {};

    // Get workers based on role
    let workerFilter: any = {};
    if (auth.role === "HR") {
      const hrUser = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { institution: true, department: true },
      });
      workerFilter = {
        OR: [
          { hrId: auth.userId },
          { institution: hrUser?.institution || "", department: hrUser?.department || "" },
        ],
      };
    }

    if (type === "summary") {
      // General summary report
      const workers = await prisma.worker.findMany({
        where: workerFilter,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, status: true, institution: true, department: true, createdAt: true } },
        },
      });

      const totalWorkers = workers.length;
      const activeWorkers = workers.filter(w => w.user.status === "ACTIVE").length;
      const withGPS = workers.filter(w => w.homeLat !== null).length;
      const withAddress = workers.filter(w => w.homeAddress).length;

      // Attendance summary
      const today = new Date().toISOString().split("T")[0];
      const workerIds = workers.map(w => w.id);
      const todayAttendance = await prisma.attendance.findMany({
        where: { workerId: { in: workerIds }, date: today },
      });

      const present = todayAttendance.filter(a => a.status === "PRESENT").length;
      const late = todayAttendance.filter(a => a.status === "LATE").length;
      const absent = totalWorkers - present - late;

      return NextResponse.json({
        type: "summary",
        generatedAt: new Date().toISOString(),
        generatedBy: auth.role,
        stats: { totalWorkers, activeWorkers, withGPS, withAddress, present, late, absent },
        workers: workers.map(w => ({
          name: `${w.user.firstName} ${w.user.lastName}`,
          email: w.user.email,
          phone: w.user.phone || "N/A",
          jobTitle: w.jobTitle,
          institution: w.user.institution || "N/A",
          department: w.user.department || "N/A",
          homeAddress: w.homeAddress || "Not provided",
          workAddress: w.workAddress || "Not provided",
          hasGPS: w.homeLat !== null,
          status: w.user.status,
          registeredAt: w.user.createdAt,
        })),
      });
    }

    if (type === "attendance") {
      // Attendance report
      const workerIds = (await prisma.worker.findMany({
        where: workerFilter,
        select: { id: true },
      })).map(w => w.id);

      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          workerId: { in: workerIds },
          ...(startDate && endDate ? {
            date: { gte: startDate, lte: endDate },
          } : {}),
        },
        include: {
          worker: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
        orderBy: { date: "desc" },
      });

      // Group by worker
      const workerAttendance: Record<string, any> = {};
      attendanceRecords.forEach(r => {
        const key = r.workerId;
        if (!workerAttendance[key]) {
          workerAttendance[key] = {
            name: `${r.worker.user.firstName} ${r.worker.user.lastName}`,
            email: r.worker.user.email,
            present: 0, late: 0, absent: 0, records: [],
          };
        }
        workerAttendance[key][r.status.toLowerCase()]++;
        workerAttendance[key].records.push({
          date: r.date,
          status: r.status,
          checkInTime: r.checkInTime,
          distance: r.distanceFromWork,
        });
      });

      return NextResponse.json({
        type: "attendance",
        generatedAt: new Date().toISOString(),
        period: { start: startDate || "All time", end: endDate || "Today" },
        totalRecords: attendanceRecords.length,
        workers: Object.values(workerAttendance),
      });
    }

    if (type === "location") {
      // Location/GPS report
      const workers = await prisma.worker.findMany({
        where: { ...workerFilter, homeLat: { not: null } },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          locationLogs: { orderBy: { recordedAt: "desc" }, take: 5 },
        },
      });

      return NextResponse.json({
        type: "location",
        generatedAt: new Date().toISOString(),
        totalWorkersWithGPS: workers.length,
        workers: workers.map(w => ({
          name: `${w.user.firstName} ${w.user.lastName}`,
          email: w.user.email,
          homeAddress: w.homeAddress || "N/A",
          homeLat: w.homeLat,
          homeLng: w.homeLng,
          workAddress: w.workAddress || "N/A",
          workLat: w.workLat,
          workLng: w.workLng,
          recentLocations: w.locationLogs.map(l => ({
            lat: l.lat, lng: l.lng, time: l.recordedAt,
          })),
        })),
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
