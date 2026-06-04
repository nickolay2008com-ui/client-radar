import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

type RuntimeRequire = (id: string) => unknown;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  try {
    const runtimeRequire = Function("return require")() as RuntimeRequire;
    const { PrismaPg } = runtimeRequire("@prisma/adapter-pg") as {
      PrismaPg: new (options: { connectionString: string }) => unknown;
    };

    if (connectionString) {
      return new PrismaClient({ adapter: new PrismaPg({ connectionString }) } as ConstructorParameters<typeof PrismaClient>[0]);
    }
  } catch {
    // The adapter may be unavailable in local build caches. Railway installs dependencies from package.json.
  }

  return new PrismaClient({
    accelerateUrl: process.env.PRISMA_ACCELERATE_URL ?? "prisma://localhost",
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
