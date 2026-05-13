import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";

// GET — get tickets (user sees own, admin sees all)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let tickets;
    if (currentUser.role === "ADMIN") {
      tickets = await prisma.supportTicket.findMany({
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      tickets = await prisma.supportTicket.findMany({
        where: { userId: currentUser.userId },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

// POST — create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, message } = await request.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: { userId: currentUser.userId, subject, message },
    });

    // Notify all admins
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { firstName: true, lastName: true, email: true, role: true },
    });
    await notifyAllAdmins("New Support Request",
      `${user?.firstName} ${user?.lastName} (${user?.role}) submitted: "${subject}"`, "INFO");

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

// PUT — admin responds to a ticket
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can respond" }, { status: 403 });
    }

    const { ticketId, response, status } = await request.json();

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { response, status: status || "RESOLVED", respondedBy: currentUser.userId },
    });

    // Notify the user who submitted
    await createNotification(ticket.userId, "Support Response",
      `Admin responded to your request "${ticket.subject}": ${response?.substring(0, 80)}`, "INFO");

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
