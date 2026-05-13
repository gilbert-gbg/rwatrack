import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let workers;

    if (currentUser.role === "ADMIN") {
      // Admin sees ALL workers
      workers = await prisma.worker.findMany({
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              phone: true, status: true, institution: true, department: true, createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (currentUser.role === "HR") {
      // HR only sees workers assigned to them (same institution + department)
      const hrUser = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { institution: true, department: true },
      });

      workers = await prisma.worker.findMany({
        where: {
          OR: [
            { hrId: currentUser.userId },
            {
              institution: hrUser?.institution || "",
              department: hrUser?.department || "",
            },
          ],
        },
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              phone: true, status: true, institution: true, department: true, createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(workers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load workers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || (currentUser.role !== "HR" && currentUser.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, jobTitle, homeAddress, workAddress, homeLat, homeLng, workLat, workLng } = body;

    const worker = await prisma.worker.create({
      data: {
        userId,
        jobTitle: jobTitle || "Field Worker",
        homeAddress,
        workAddress,
        homeLat: homeLat ? parseFloat(homeLat) : null,
        homeLng: homeLng ? parseFloat(homeLng) : null,
        workLat: workLat ? parseFloat(workLat) : null,
        workLng: workLng ? parseFloat(workLng) : null,
        hrId: currentUser.userId,
      },
    });

    return NextResponse.json(worker);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create worker" }, { status: 500 });
  }
}
