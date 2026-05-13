import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { notifyAllAdmins, createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email, password, firstName, lastName, phone, role,
      institution, department, jobTitle, nationalId,
      homeAddress, workAddress, homeProvince, homeDistrict,
      workProvince, workDistrict,
    } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["WORKER", "HR"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (!institution || !department) {
      return NextResponse.json({ error: "Institution and department are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim(),
        role,
        status: "INACTIVE",
        institution,
        department,
      },
    });

    if (role === "WORKER") {
      // Find matching HR
      const matchingHR = await prisma.user.findFirst({
        where: { role: "HR", status: "ACTIVE", institution, department },
        select: { id: true, firstName: true, lastName: true },
      });

      await prisma.worker.create({
        data: {
          userId: user.id,
          jobTitle: jobTitle || "Field Worker",
          institution,
          department,
          hrId: matchingHR?.id || null,
          homeAddress: homeAddress || null,
          workAddress: workAddress || null,
        },
      });

      // Notify HR
      if (matchingHR) {
        await createNotification(
          matchingHR.id,
          "New Worker Registration",
          `${firstName} ${lastName} (${email}) registered under ${institution} — ${department}. Home: ${homeAddress || "N/A"}. Please review and approve.`,
          "REGISTRATION"
        );
      }
    } else if (role === "HR") {
      await notifyAllAdmins(
        "New HR Manager Registration",
        `${firstName} ${lastName} (${email}) registered as HR for ${institution} — ${department}. Please review and approve.`,
        "REGISTRATION"
      );
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        resource: "AUTH",
        details: `${role} registration: ${institution} — ${department}. Home: ${homeDistrict || "N/A"}, ${homeProvince || "N/A"}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      message: "Registration successful. Your account is pending approval.",
      user: { id: user.id, email: user.email, firstName, lastName, role, status: "INACTIVE" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
