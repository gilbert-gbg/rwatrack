import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — returns list of institutions/departments from registered HR managers
export async function GET(request: NextRequest) {
  try {
    const hrManagers = await prisma.user.findMany({
      where: { role: "HR", status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        institution: true,
        department: true,
      },
    });

    // Build unique institution + department pairs
    const departments = hrManagers
      .filter((hr) => hr.institution && hr.department)
      .map((hr) => ({
        hrId: hr.id,
        hrName: `${hr.firstName} ${hr.lastName}`,
        institution: hr.institution,
        department: hr.department,
        label: `${hr.institution} — ${hr.department}`,
      }));

    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load departments" }, { status: 500 });
  }
}
