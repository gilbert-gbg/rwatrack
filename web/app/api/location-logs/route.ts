import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lat, lng, accuracy } = await request.json();
  if (!lat || !lng) return NextResponse.json({ error: "lat and lng required" }, { status: 400 });

  const worker = await prisma.worker.findUnique({ where: { userId: auth.userId } });
  if (!worker) return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });

  // Save location log
  const log = await prisma.locationLog.create({
    data: { workerId: worker.id, lat, lng, accuracy },
  });

  // Update worker's home coordinates
  await prisma.worker.update({
    where: { id: worker.id },
    data: {
      homeLat: lat,
      homeLng: lng,
      homeAddress: worker.homeAddress || `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    },
  });

  // Auto-record attendance for today
  const today = new Date().toISOString().split("T")[0];
  const existingAttendance = await prisma.attendance.findFirst({
    where: { workerId: worker.id, date: today },
  });

  if (!existingAttendance) {
    let distance = null;
    let status = "PRESENT";

    if (worker.workLat && worker.workLng) {
      distance = getDistanceMeters(lat, lng, worker.workLat, worker.workLng);
      if (distance <= 500) status = "PRESENT";
      else if (distance <= 2000) status = "LATE";
      else status = "ABSENT";
    }

    const hours = new Date().getHours();
    if (hours >= 9 && status === "PRESENT") status = "LATE";

    await prisma.attendance.create({
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
  }

  return NextResponse.json(log, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = await getCurrentUser(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (auth.role === "WORKER") {
    const worker = await prisma.worker.findUnique({ where: { userId: auth.userId } });
    if (!worker) return NextResponse.json([]);
    const logs = await prisma.locationLog.findMany({
      where: { workerId: worker.id },
      orderBy: { recordedAt: "desc" },
      take: 20,
    });
    return NextResponse.json(logs);
  }

  if (!["ADMIN", "HR"].includes(auth.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workerId = request.nextUrl.searchParams.get("workerId");
  const logs = await prisma.locationLog.findMany({
    where: workerId ? { workerId } : undefined,
    include: { worker: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
    orderBy: { recordedAt: "desc" },
    take: 200,
  });

  return NextResponse.json(logs);
}
