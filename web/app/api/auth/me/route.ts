import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, bio: true, role: true, status: true,
        institution: true, department: true, createdAt: true,
        worker: {
          select: {
            id: true, jobTitle: true, homeAddress: true, workAddress: true,
            homeLat: true, homeLng: true, workLat: true, workLng: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { firstName, lastName, phone, avatar, bio, homeAddress, workAddress } = body;

    // Get old data to compare
    const oldUser = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { firstName: true, lastName: true, phone: true, bio: true, role: true, institution: true, department: true },
    });

    const oldWorker = await prisma.worker.findUnique({
      where: { userId: currentUser.userId },
      select: { homeAddress: true, workAddress: true },
    });

    // Update user
    const updated = await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
        ...(bio !== undefined && { bio }),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, bio: true, role: true, status: true,
        institution: true, department: true, createdAt: true,
        worker: {
          select: {
            id: true, jobTitle: true, homeAddress: true, workAddress: true,
            homeLat: true, homeLng: true, workLat: true, workLng: true,
          },
        },
      },
    });

    // Update worker address if provided
    if ((homeAddress !== undefined || workAddress !== undefined) && updated.worker) {
      await prisma.worker.update({
        where: { id: updated.worker.id },
        data: {
          ...(homeAddress !== undefined && { homeAddress }),
          ...(workAddress !== undefined && { workAddress }),
        },
      });
      // Refresh worker data
      updated.worker = await prisma.worker.findUnique({
        where: { id: updated.worker.id },
        select: {
          id: true, jobTitle: true, homeAddress: true, workAddress: true,
          homeLat: true, homeLng: true, workLat: true, workLng: true,
        },
      }) as any;
    }

    // Build list of what changed
    const changes = [];
    if (firstName && firstName !== oldUser?.firstName) changes.push(`Name: ${oldUser?.firstName} → ${firstName}`);
    if (lastName && lastName !== oldUser?.lastName) changes.push(`Last name: ${oldUser?.lastName} → ${lastName}`);
    if (phone !== undefined && phone !== oldUser?.phone) changes.push(`Phone: ${oldUser?.phone || "none"} → ${phone}`);
    if (bio !== undefined && bio !== oldUser?.bio) changes.push(`Bio updated`);
    if (avatar !== undefined) changes.push(`Profile photo updated`);
    if (homeAddress !== undefined && homeAddress !== oldWorker?.homeAddress) changes.push(`Home address: ${oldWorker?.homeAddress || "none"} → ${homeAddress}`);
    if (workAddress !== undefined && workAddress !== oldWorker?.workAddress) changes.push(`Work address: ${oldWorker?.workAddress || "none"} → ${workAddress}`);

    const changeText = changes.length > 0 ? changes.join(" | ") : "Profile updated";

    // Send notifications based on role
    if (currentUser.role === "WORKER" && changes.length > 0) {
      const worker = await prisma.worker.findUnique({
        where: { userId: currentUser.userId },
        select: { hrId: true },
      });
      if (worker?.hrId) {
        await createNotification(
          worker.hrId,
          "Worker Updated Profile",
          `${updated.firstName} ${updated.lastName} (${updated.email}) made changes: ${changeText}`,
          "INFO"
        );
      }
    } else if (currentUser.role === "HR" && changes.length > 0) {
      await notifyAllAdmins(
        "HR Manager Updated Profile",
        `HR ${updated.firstName} ${updated.lastName} (${updated.institution || ""} — ${updated.department || ""}) made changes: ${changeText}`,
        "INFO"
      );
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.userId,
        action: "UPDATE_PROFILE",
        resource: "USER",
        details: changeText,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
