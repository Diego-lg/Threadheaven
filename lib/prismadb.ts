import { PrismaClient } from "@prisma/client";

declare global {
  // Use var here to ensure the prisma instance is truly global
  var prisma: PrismaClient | undefined;
}

const prismadb = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prismadb;

export default prismadb;
