import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hrs = await prisma.user.findMany({
    where: { role: "HR" },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, status: true, createdAt: true,
      managedWorkers: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(hrs);
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { firstName, lastName, email, phone, password } = await request.json();
  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName, phone, role: "HR" },
  });

  await prisma.auditLog.create({
    data: { userId: auth.userId, action: "CREATE_HR", resource: `User:${user.id}` },
  });

  return NextResponse.json(
    { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    { status: 201 }
  );
}
