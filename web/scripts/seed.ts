import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@rwatrack.com" },
    update: {
      role: "ADMIN",
      password: await hash("Test@12345"),
    },
    create: {
      email: "admin@rwatrack.com",
      password: await hash("Test@12345"),
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  // HR
  const hr = await prisma.user.upsert({
    where: { email: "hr@rwatrack.com" },
    update: {
      role: "HR",
      password: await hash("Test@12345"),
    },
    create: {
      email: "hr@rwatrack.com",
      password: await hash("Test@12345"),
      firstName: "HR",
      lastName: "Manager",
      role: "HR",
    },
  });

  // Worker
  const workerUser = await prisma.user.upsert({
    where: { email: "worker@rwatrack.com" },
    update: {
      role: "WORKER",
      password: await hash("Test@12345"),
    },
    create: {
      email: "worker@rwatrack.com",
      password: await hash("Test@12345"),
      firstName: "Josiane",
      lastName: "Abayisenga",
      phone: "+250700000000",
      role: "WORKER",
    },
  });

  await prisma.worker.upsert({
    where: { userId: workerUser.id },
    update: {},
    create: {
      userId: workerUser.id,
      hrId: hr.id,
      jobTitle: "Field Officer",
      homeAddress: "KG 123 St, Kigali",
      workAddress: "KN 5 Rd, Kigali",
    },
  });

  console.log("✅ Seed complete:", { admin: admin.email, hr: hr.email, worker: workerUser.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
