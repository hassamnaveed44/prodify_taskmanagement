const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const db = require("../lib/db.ts").default;

async function run() {
  try {
    const tasks = await db.task.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        dueDate: true
      }
    });
    console.log("Tasks in DB:", JSON.stringify(tasks, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.$disconnect();
    process.exit(0);
  }
}

run();
