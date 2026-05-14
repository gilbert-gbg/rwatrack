import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const auth = await getCurrentUser(request);
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, role: true, status: true, institution: true,
      department: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, status, role } = await request.json();

    const oldUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true, role: true, status: true },
    });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { ...(status && { status }), ...(role && { role }) },
    });

    const changes = [];
    if (status && status !== oldUser?.status) changes.push(`Status: ${oldUser?.status} → ${status}`);
    if (role && role !== oldUser?.role) changes.push(`Role: ${oldUser?.role} → ${role}`);
    const changeText = changes.join(", ") || "User updated";

    // In-app notification
    await createNotification(userId, "Account Updated",
      `Your account has been updated: ${changeText}`,
      status === "ACTIVE" ? "APPROVAL" : status === "SUSPENDED" ? "REJECTION" : "INFO");

    // Email notification for approval/rejection
    if (status === "ACTIVE" && oldUser?.status !== "ACTIVE") {
      await sendApprovalEmail(updated.email, updated.firstName, updated.role);
    } else if (status === "SUSPENDED") {
      await sendRejectionEmail(updated.email, updated.firstName);
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.userId, action: "UPDATE_USER", resource: "USER",
        details: `Admin updated ${updated.email}: ${changeText}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
