import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || (currentUser.role !== "HR" && currentUser.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let pendingWorkers;

    if (currentUser.role === "ADMIN") {
      // Admin sees all pending workers
      pendingWorkers = await prisma.user.findMany({
        where: { role: "WORKER", status: "INACTIVE" },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // HR only sees pending workers in their institution + department
      const hrUser = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { institution: true, department: true },
      });

      pendingWorkers = await prisma.user.findMany({
        where: {
          role: "WORKER",
          status: "INACTIVE",
          institution: hrUser?.institution || "",
          department: hrUser?.department || "",
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(pendingWorkers);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || (currentUser.role !== "HR" && currentUser.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    // If approved, update the worker's hrId to this HR
    if (status === "ACTIVE" && currentUser.role === "HR") {
      await prisma.worker.updateMany({
        where: { userId },
        data: { hrId: currentUser.userId },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.userId,
        action: status === "ACTIVE" ? "APPROVE_WORKER" : "REJECT_WORKER",
        resource: "USER",
        details: `Worker ${updated.email} ${status === "ACTIVE" ? "approved" : "rejected"} by ${currentUser.role}`,
      },
    });

    // Notify the worker
    if (status === "ACTIVE") {
      await createNotification(
        userId,
        "Account Approved!",
        "Your worker account has been approved. You can now login to RWATRACK.",
        "APPROVAL"
      );
    } else if (status === "SUSPENDED") {
      await createNotification(
        userId,
        "Account Rejected",
        "Your worker registration was not approved. Please contact HR for more information.",
        "REJECTION"
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
