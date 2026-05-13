import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AlertStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user || !["ADMIN", "HR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where = status ? { status: status as AlertStatus } : {};

    const alerts = await prisma.fraudAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("[v0] Get fraud alerts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description, severity } = await request.json();

    const alert = await prisma.fraudAlert.create({
      data: {
        description,
        severity,
        status: "OPEN",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "CREATE_FRAUD_ALERT",
        resource: `FraudAlert:${alert.id}`,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("[v0] Create fraud alert error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
