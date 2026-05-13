import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentUser(request);
  if (!auth || !["ADMIN", "HR"].includes(auth.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const worker = await prisma.worker.findFirst({
    where: auth.role === "HR"
      ? { id, hrId: auth.userId, department: auth.department }
      : { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
      hr: { select: { firstName: true, lastName: true, email: true } },
      locationLogs: { orderBy: { recordedAt: "desc" }, take: 50 },
    },
  });

  if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(worker);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentUser(request);
  if (!auth || !["ADMIN", "HR"].includes(auth.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const existingWorker = auth.role === "HR"
    ? await prisma.worker.findFirst({ where: { id, hrId: auth.userId, department: auth.department } })
    : await prisma.worker.findUnique({ where: { id } });

  if (!existingWorker) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  const worker = await prisma.worker.update({
    where: { id },
    data: {
      jobTitle: data.jobTitle,
      hrId: data.hrId,
      homeAddress: data.homeAddress,
      homeLat: data.homeLat,
      homeLng: data.homeLng,
      workAddress: data.workAddress,
      workLat: data.workLat,
      workLng: data.workLng,
      user: data.phone ? { update: { phone: data.phone } } : undefined,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
      hr: { select: { firstName: true, lastName: true, email: true } },
      locationLogs: { orderBy: { recordedAt: "desc" }, take: 50 },
    },
  });

  return NextResponse.json(worker);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentUser(request);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.worker.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
