import "./load-env";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { normalizePermissions } from "../lib/permissions";

async function main() {
  const email = process.env.ROOT_ADMIN_EMAIL;
  const password = process.env.ROOT_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ROOT_ADMIN_EMAIL and ROOT_ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        password: hashed,
        role: "ADMIN",
        isRoot: true,
        status: "ACTIVE",
        suspendedAt: null,
        deleteAfter: null,
        deletedAt: null,
      },
    });
    console.log(`root admin updated: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        name: "ผู้ดูแลระบบหลัก",
        password: hashed,
        role: "ADMIN",
        isRoot: true,
        status: "ACTIVE",
        permissions: normalizePermissions({}),
      },
    });
    console.log(`root admin created: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
