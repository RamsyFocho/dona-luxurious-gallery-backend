import { PrismaClient } from "@prisma/client";

// Use a global to preserve the PrismaClient instance across module reloads
// in development (prevents creating too many connections).
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
