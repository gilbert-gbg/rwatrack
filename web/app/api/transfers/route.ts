import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

// GET — get transfer requests
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");

    if (auth.role === "WORKER") {
      // Worker sees their own transfers
      const worker = await prisma.worker.findUnique({ where: { userId: auth.userId } });
      if (!worker) return NextResponse.json([]);

      const transfers = await prisma.transferRequest.findMany({
        where: { workerId: worker.id },
        orderBy: { createdAt: "desc" },
      });

      const history = await prisma.workHistory.findMany({
        where: { workerId: worker.id },
        orderBy: { startDate: "desc" },
      });

      return NextResponse.json({ transfers, history });
    }

    if (auth.role === "HR") {
      const hrUser = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { institution: true, department: true, firstName: true, lastName: true },
      });

      // HR sees transfers where they are old HR or new HR
      const transfers = await prisma.transferRequest.findMany({
        where: {
          OR: [
            { oldHrId: auth.userId },
            { newHrId: auth.userId },
            { fromInstitution: hrUser?.institution || "", fromDepartment: hrUser?.department || "" },
            { toInstitution: hrUser?.institution || "", toDepartment: hrUser?.department || "" },
          ],
        },
        include: {
          worker: {
            include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // If specific worker requested, get their history
      let workerHistory: any[] = [];
      if (workerId) {
        // Check if data access is granted
        const transfer = await prisma.transferRequest.findFirst({
          where: { workerId, newHrId: auth.userId, dataAccessGranted: true },
        });

        const isCurrentHR = await prisma.worker.findFirst({
          where: { id: workerId, hrId: auth.userId },
        });

        if (transfer || isCurrentHR) {
          workerHistory = await prisma.workHistory.findMany({
            where: { workerId },
            orderBy: { startDate: "desc" },
          });
        }
      }

      return NextResponse.json({ transfers, workerHistory });
    }

    if (auth.role === "ADMIN") {
      const transfers = await prisma.transferRequest.findMany({
        include: {
          worker: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ transfers });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load transfers" }, { status: 500 });
  }
}

// POST — create transfer request (worker) or approve/reject (HR)
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action } = body;

    // Worker submits transfer request
    if (action === "request" && auth.role === "WORKER") {
      const { toInstitution, toDepartment, reason } = body;

      if (!toInstitution || !toDepartment || !reason) {
        return NextResponse.json({ error: "All fields required" }, { status: 400 });
      }

      const worker = await prisma.worker.findUnique({
        where: { userId: auth.userId },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

      // Find old HR and new HR
      const oldHR = worker.hrId ? await prisma.user.findUnique({
        where: { id: worker.hrId },
        select: { id: true, firstName: true, lastName: true },
      }) : null;

      const newHR = await prisma.user.findFirst({
        where: { role: "HR", status: "ACTIVE", institution: toInstitution, department: toDepartment },
        select: { id: true, firstName: true, lastName: true },
      });

      const transfer = await prisma.transferRequest.create({
        data: {
          workerId: worker.id,
          fromInstitution: worker.institution || "N/A",
          fromDepartment: worker.department || "N/A",
          toInstitution,
          toDepartment,
          reason,
          oldHrId: oldHR?.id || null,
          newHrId: newHR?.id || null,
        },
      });

      // Notify old HR
      if (oldHR) {
        await createNotification(oldHR.id, "Transfer Request",
          `${worker.user.firstName} ${worker.user.lastName} has requested a transfer from ${worker.institution} — ${worker.department} to ${toInstitution} — ${toDepartment}. Reason: ${reason}`,
          "INFO");
      }

      // Notify new HR
      if (newHR) {
        await createNotification(newHR.id, "Incoming Transfer Request",
          `${worker.user.firstName} ${worker.user.lastName} wants to transfer to your department (${toInstitution} — ${toDepartment}). Waiting for current HR approval.`,
          "INFO");
      }

      return NextResponse.json(transfer, { status: 201 });
    }

    // HR approves release (old HR)
    if (action === "approve_release" && auth.role === "HR") {
      const { transferId } = body;

      const transfer = await prisma.transferRequest.update({
        where: { id: transferId },
        data: { oldHrApproval: true, status: "OLD_HR_APPROVED" },
        include: { worker: { include: { user: { select: { firstName: true, lastName: true } } } } },
      });

      // Notify new HR that old HR approved
      if (transfer.newHrId) {
        await createNotification(transfer.newHrId, "Transfer Approved by Current HR",
          `${transfer.worker.user.firstName} ${transfer.worker.user.lastName}'s transfer has been approved by their current HR. Please review and accept the worker into your department.`,
          "APPROVAL");
      }

      // Notify worker
      await createNotification(transfer.worker.userId, "Transfer Approved by Current HR",
        `Your transfer request to ${transfer.toInstitution} — ${transfer.toDepartment} has been approved by your current HR. Waiting for new HR to accept.`,
        "APPROVAL");

      return NextResponse.json(transfer);
    }

    // New HR accepts the worker
    if (action === "approve_join" && auth.role === "HR") {
      const { transferId } = body;

      const transfer = await prisma.transferRequest.findUnique({
        where: { id: transferId },
        include: { worker: { include: { user: true } } },
      });

      if (!transfer) return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
      if (!transfer.oldHrApproval) {
        return NextResponse.json({ error: "Current HR must approve first" }, { status: 400 });
      }

      // Save work history BEFORE changing
      await prisma.workHistory.create({
        data: {
          workerId: transfer.workerId,
          institution: transfer.fromInstitution,
          department: transfer.fromDepartment,
          jobTitle: transfer.worker.jobTitle || "Field Worker",
          hrName: transfer.oldHrId ? (await prisma.user.findUnique({
            where: { id: transfer.oldHrId },
            select: { firstName: true, lastName: true },
          })).firstName + " " + (await prisma.user.findUnique({
            where: { id: transfer.oldHrId },
            select: { firstName: true, lastName: true },
          })).lastName : "N/A",
          startDate: transfer.worker.createdAt,
          endDate: new Date(),
          reason: transfer.reason,
        },
      });

      // Update worker to new department and HR
      await prisma.worker.update({
        where: { id: transfer.workerId },
        data: {
          institution: transfer.toInstitution,
          department: transfer.toDepartment,
          hrId: auth.userId,
        },
      });

      // Update user institution/department too
      await prisma.user.update({
        where: { id: transfer.worker.userId },
        data: {
          institution: transfer.toInstitution,
          department: transfer.toDepartment,
        },
      });

      // Update transfer status
      await prisma.transferRequest.update({
        where: { id: transferId },
        data: { newHrApproval: true, status: "COMPLETED" },
      });

      // Notify worker
      await createNotification(transfer.worker.userId, "Transfer Complete!",
        `You have been transferred to ${transfer.toInstitution} — ${transfer.toDepartment}. Your new HR manager will manage your account.`,
        "APPROVAL");

      // Notify old HR
      if (transfer.oldHrId) {
        await createNotification(transfer.oldHrId, "Worker Transfer Completed",
          `${transfer.worker.user.firstName} ${transfer.worker.user.lastName} has been transferred to ${transfer.toInstitution} — ${transfer.toDepartment}.`,
          "INFO");
      }

      return NextResponse.json({ message: "Transfer completed" });
    }

    // HR rejects transfer
    if (action === "reject" && auth.role === "HR") {
      const { transferId, rejectReason } = body;

      const transfer = await prisma.transferRequest.update({
        where: { id: transferId },
        data: { status: "REJECTED" },
        include: { worker: { include: { user: { select: { firstName: true, lastName: true, id: true } } } } },
      });

      await createNotification(transfer.worker.user.id, "Transfer Rejected",
        `Your transfer request to ${transfer.toInstitution} — ${transfer.toDepartment} was rejected. ${rejectReason || ""}`,
        "REJECTION");

      return NextResponse.json(transfer);
    }

    // HR grants data access to new HR
    if (action === "grant_access" && auth.role === "HR") {
      const { transferId } = body;

      const transfer = await prisma.transferRequest.update({
        where: { id: transferId },
        data: { dataAccessGranted: true },
        include: { worker: { include: { user: { select: { firstName: true, lastName: true } } } } },
      });

      if (transfer.newHrId) {
        await createNotification(transfer.newHrId, "Data Access Granted",
          `You now have access to ${transfer.worker.user.firstName} ${transfer.worker.user.lastName}'s previous work history, attendance, and location data.`,
          "APPROVAL");
      }

      return NextResponse.json(transfer);
    }

    // New HR requests data access
    if (action === "request_access" && auth.role === "HR") {
      const { transferId } = body;

      const transfer = await prisma.transferRequest.findUnique({
        where: { id: transferId },
        include: { worker: { include: { user: { select: { firstName: true, lastName: true } } } } },
      });

      if (transfer?.oldHrId) {
        await createNotification(transfer.oldHrId, "Data Access Request",
          `The new HR manager is requesting access to ${transfer.worker.user.firstName} ${transfer.worker.user.lastName}'s previous data and work history. Please go to Transfers to grant or deny access.`,
          "INFO");
      }

      return NextResponse.json({ message: "Access request sent to previous HR" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: "Failed to process transfer" }, { status: 500 });
  }
}
