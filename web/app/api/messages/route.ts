import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

// GET — get conversations for current user
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const chatWith = searchParams.get("chatWith");

    if (chatWith) {
      // Get messages between current user and specific person
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUser.userId, receiverId: chatWith, broadcast: false },
            { senderId: chatWith, receiverId: currentUser.userId, broadcast: false },
          ],
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      });

      // Mark unread messages as read
      await prisma.message.updateMany({
        where: { senderId: chatWith, receiverId: currentUser.userId, read: false },
        data: { read: true },
      });

      return NextResponse.json({ messages });
    }

    // Get list of conversations (latest message per person)
    const sent = await prisma.message.findMany({
      where: { senderId: currentUser.userId, broadcast: false },
      include: { receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    const received = await prisma.message.findMany({
      where: { receiverId: currentUser.userId, broadcast: false },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Get broadcast messages sent to this user's role
    const broadcastTarget = currentUser.role === "WORKER" ? "ALL_WORKERS" : currentUser.role === "HR" ? "ALL_HR" : null;
    let broadcasts: any[] = [];
    if (broadcastTarget) {
      broadcasts = await prisma.message.findMany({
        where: { broadcast: true, broadcastTo: broadcastTarget },
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }

    // Build unique contact list
    const contactMap = new Map();
    [...sent, ...received].forEach((msg) => {
      const other = msg.senderId === currentUser.userId
        ? msg.receiver || msg.sender
        : msg.sender;
      if (other && !contactMap.has(other.id)) {
        contactMap.set(other.id, {
          user: other,
          lastMessage: msg.content,
          lastTime: msg.createdAt,
          unread: msg.senderId !== currentUser.userId && !msg.read ? 1 : 0,
        });
      } else if (other && contactMap.has(other.id) && msg.senderId !== currentUser.userId && !msg.read) {
        const existing = contactMap.get(other.id);
        existing.unread += 1;
      }
    });

    // Count total unread
    const unreadCount = await prisma.message.count({
      where: { receiverId: currentUser.userId, read: false },
    });

    return NextResponse.json({
      conversations: Array.from(contactMap.values()),
      broadcasts,
      unreadCount,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

// POST — send a message
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId, content, broadcast, broadcastTo } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // Broadcast message
    if (broadcast && broadcastTo) {
      const msg = await prisma.message.create({
        data: {
          senderId: currentUser.userId,
          content: content.trim(),
          broadcast: true,
          broadcastTo,
        },
      });

      // Notify all recipients
      const targetRole = broadcastTo === "ALL_WORKERS" ? "WORKER" : "HR";
      const targets = await prisma.user.findMany({
        where: { role: targetRole, status: "ACTIVE" },
        select: { id: true },
      });

      // If HR broadcasting to workers, only notify workers in their department
      let filteredTargets = targets;
      if (currentUser.role === "HR" && broadcastTo === "ALL_WORKERS") {
        const hrUser = await prisma.user.findUnique({
          where: { id: currentUser.userId },
          select: { institution: true, department: true },
        });
        const deptWorkers = await prisma.user.findMany({
          where: { role: "WORKER", status: "ACTIVE", institution: hrUser?.institution, department: hrUser?.department },
          select: { id: true },
        });
        filteredTargets = deptWorkers;
      }

      const senderUser = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { firstName: true, lastName: true },
      });

      await Promise.all(filteredTargets.map((t) =>
        createNotification(t.id, "New Broadcast Message",
          `${senderUser?.firstName} ${senderUser?.lastName} sent a message to all: "${content.trim().substring(0, 50)}..."`, "INFO")
      ));

      return NextResponse.json(msg);
    }

    // Direct message
    if (!receiverId) {
      return NextResponse.json({ error: "Receiver is required" }, { status: 400 });
    }

    const msg = await prisma.message.create({
      data: {
        senderId: currentUser.userId,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      },
    });

    // Notify receiver
    const senderUser = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { firstName: true, lastName: true },
    });
    await createNotification(receiverId, "New Message",
      `${senderUser?.firstName} ${senderUser?.lastName}: "${content.trim().substring(0, 60)}"`, "INFO");

    return NextResponse.json(msg);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
