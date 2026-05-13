import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "REGISTRATION" | "APPROVAL" | "REJECTION" | "INFO" = "INFO"
) {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function notifyAllAdmins(title: string, message: string, type: "REGISTRATION" | "APPROVAL" | "REJECTION" | "INFO" = "INFO") {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) => createNotification(admin.id, title, message, type))
    );
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}

export async function notifyAllHR(title: string, message: string, type: "REGISTRATION" | "APPROVAL" | "REJECTION" | "INFO" = "INFO") {
  try {
    const hrs = await prisma.user.findMany({
      where: { role: "HR", status: "ACTIVE" },
      select: { id: true },
    });
    await Promise.all(
      hrs.map((hr) => createNotification(hr.id, title, message, type))
    );
  } catch (error) {
    console.error("Failed to notify HR managers:", error);
  }
}
