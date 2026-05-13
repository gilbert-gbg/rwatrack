import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser(request);

    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alert = await prisma.fraudAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error("[v0] Get fraud alert error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser(request);

    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, resolution } = await request.json();

    const alert = await prisma.fraudAlert.update({
      where: { id },
      data: {
        status,
        resolution,
        investigatedBy: user.userId,
        resolvedAt: status === "RESOLVED" ? new Date() : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "UPDATE_FRAUD_ALERT",
        resource: `FraudAlert:${alert.id}`,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("[v0] Update fraud alert error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
