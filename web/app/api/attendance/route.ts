import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Calculate distance between two GPS points in meters (Haversine formula)
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// GET — get attendance records
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const workerId = searchParams.get("workerId");

    if (auth.role === "WORKER") {
      const worker = await prisma.worker.findUnique({ where: { userId: auth.userId } });
      if (!worker) return NextResponse.json([]);

      const records = await prisma.attendance.findMany({
        where: { workerId: worker.id, ...(date && { date }) },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return NextResponse.json(records);
    }

    // HR and Admin
    if (auth.role === "HR") {
      const hrUser = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { institution: true, department: true },
      });

      const workers = await prisma.worker.findMany({
        where: {
          OR: [
            { hrId: auth.userId },
            { institution: hrUser?.institution || "", department: hrUser?.department || "" },
          ],
        },
        select: { id: true },
      });

      const workerIds = workers.map((w) => w.id);

      const records = await prisma.attendance.findMany({
        where: {
          workerId: workerId ? workerId : { in: workerIds },
          ...(date && { date }),
          ...(!date && { date: getTodayStr() }),
        },
        include: {
          worker: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Also get workers without attendance for today
      const presentWorkerIds = records.map((r) => r.workerId);
      const absentWorkers = await prisma.worker.findMany({
        where: { id: { in: workerIds.filter((id) => !presentWorkerIds.includes(id)) } },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      });

      return NextResponse.json({ records, absentWorkers, date: date || getTodayStr() });
    }

    // Admin sees all
    if (auth.role === "ADMIN") {
      const records = await prisma.attendance.findMany({
        where: { ...(date && { date }), ...(!date && { date: getTodayStr() }), ...(workerId && { workerId }) },
        include: {
          worker: {
            include: { user: { select: { firstName: true, lastName: true, email: true, institution: true, department: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Summary stats
      const totalWorkers = await prisma.worker.count();
      const presentCount = records.filter((r) => r.status === "PRESENT").length;
      const lateCount = records.filter((r) => r.status === "LATE").length;
      const absentCount = totalWorkers - presentCount - lateCount;

      return NextResponse.json({
        records,
        stats: { total: totalWorkers, present: presentCount, late: lateCount, absent: absentCount },
        date: date || getTodayStr(),
      });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load attendance" }, { status: 500 });
  }
}

// POST — check in (from GPS or manual)
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { lat, lng, workerId: manualWorkerId, status: manualStatus } = body;

    // HR/Admin can manually mark attendance
    if (manualWorkerId && manualStatus && ["HR", "ADMIN"].includes(auth.role)) {
      const today = getTodayStr();
      const existing = await prisma.attendance.findFirst({
        where: { workerId: manualWorkerId, date: today },
      });

      if (existing) {
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: manualStatus },
        });
        return NextResponse.json(updated);
      }

      const record = await prisma.attendance.create({
        data: { workerId: manualWorkerId, date: today, status: manualStatus },
      });
      return NextResponse.json(record);
    }

    // Worker auto check-in from GPS
    if (auth.role !== "WORKER") {
      return NextResponse.json({ error: "Only workers can check in" }, { status: 403 });
    }

    if (!lat || !lng) {
      return NextResponse.json({ error: "GPS coordinates required" }, { status: 400 });
    }

    const worker = await prisma.worker.findUnique({ where: { userId: auth.userId } });
    if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    const today = getTodayStr();

    // Check if already checked in today
    const existing = await prisma.attendance.findFirst({
      where: { workerId: worker.id, date: today },
    });

    if (existing) {
      return NextResponse.json({ message: "Already checked in today", attendance: existing });
    }

    // Calculate distance from work location
    let distance = null;
    let status = "PRESENT";

    if (worker.workLat && worker.workLng) {
      distance = getDistanceMeters(lat, lng, worker.workLat, worker.workLng);
      // Within 500m = PRESENT, 500m-2km = LATE, >2km = ABSENT
      if (distance <= 500) {
        status = "PRESENT";
      } else if (distance <= 2000) {
        status = "LATE";
      } else {
        status = "ABSENT";
      }
    }

    // Check time — after 9:00 AM = LATE (if within range)
    const now = new Date();
    const hours = now.getHours();
    if (hours >= 9 && status === "PRESENT") {
      status = "LATE";
    }

    const record = await prisma.attendance.create({
      data: {
        workerId: worker.id,
        date: today,
        status,
        checkInTime: new Date(),
        checkInLat: lat,
        checkInLng: lng,
        distanceFromWork: distance ? Math.round(distance) : null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}
