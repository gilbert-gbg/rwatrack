import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { id: true, password: true, firstName: true, lastName: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: { password: hashed },
    });

    // Notify based on role
    if (user.role === "WORKER") {
      // Notify HR
      const worker = await prisma.worker.findUnique({
        where: { userId: user.id },
        select: { hrId: true },
      });
      if (worker?.hrId) {
        await createNotification(
          worker.hrId,
          "Worker Changed Password",
          `${user.firstName} ${user.lastName} (${user.email}) changed their password.`,
          "INFO"
        );
      }
    } else if (user.role === "HR") {
      // Notify admins
      await notifyAllAdmins(
        "HR Manager Changed Password",
        `HR Manager ${user.firstName} ${user.lastName} (${user.email}) changed their password.`,
        "INFO"
      );
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.userId,
        action: "PASSWORD_CHANGE",
        resource: "AUTH",
        details: "Password changed successfully",
      },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
