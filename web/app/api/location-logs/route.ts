import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lat, lng, accuracy } = await request.json();
  if (!lat || !lng) return NextResponse.json({ error: "lat and lng required" }, { status: 400 });

  const worker = await prisma.worker.findUnique({ where: { userId: auth.userId } });
  if (!worker) return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });

  // Save to location log
  const log = await prisma.locationLog.create({
    data: { workerId: worker.id, lat, lng, accuracy },
  });

  // Also update the worker's home coordinates with the latest GPS position
  // This makes the worker appear on the HR's map
  await prisma.worker.update({
    where: { id: worker.id },
    data: {
      homeLat: lat,
      homeLng: lng,
      homeAddress: worker.homeAddress || `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    },
  });

  return NextResponse.json(log, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = await getCurrentUser(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Workers can see their own logs
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

  // HR and Admin can see logs
  if (!["ADMIN", "HR"].includes(auth.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workerId = request.nextUrl.searchParams.get("workerId");
  const where = workerId ? { workerId } : undefined;

  const logs = await prisma.locationLog.findMany({
    where,
    include: { worker: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
    orderBy: { recordedAt: "desc" },
    take: 200,
  });

  return NextResponse.json(logs);
}
