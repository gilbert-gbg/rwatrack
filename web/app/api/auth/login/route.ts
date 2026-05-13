import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter your email and password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        institution: true,
        department: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again" },
        { status: 401 }
      );
    }

    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `This account is registered as ${user.role}, not ${role}. Please select the correct role.` },
        { status: 403 }
      );
    }

    if (user.status === "INACTIVE") {
      const approver = user.role === "HR" ? "Admin" : "HR Manager";
      return NextResponse.json(
        {
          error: `Your account is pending approval by ${approver}. Please wait to be activated.`,
          pending: true,
        },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact the administrator." },
        { status: 403 }
      );
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      institution: user.institution || undefined,
      department: user.department || undefined,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: { userId: user.id, token, expiresAt },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        resource: "AUTH",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
      },
    });

    await setAuthCookie(token);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
