const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not defined");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });
    console.log("Users:", users);

    const dms = await prisma.directMessage.findMany();
    console.log("DMs:", dms);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
