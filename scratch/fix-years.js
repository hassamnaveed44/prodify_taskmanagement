const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const db = require("../lib/db.ts").default;

async function run() {
  try {
    const tasks = await db.task.findMany({
      where: {
        dueDate: { not: null }
      }
    });

    console.log("Normalizing tasks to year 2026...");
    let updatedCount = 0;

    for (const t of tasks) {
      if (t.dueDate) {
        const date = new Date(t.dueDate);
        if (date.getFullYear() < 2020) {
          date.setFullYear(2026);
          
          await db.task.update({
            where: { id: t.id },
            data: { dueDate: date }
          });
          
          console.log(`Updated task "${t.name}" due date to ${date.toISOString()}`);
          updatedCount++;
        }
      }
    }

    console.log(`Successfully normalized ${updatedCount} task due dates to 2026!`);
  } catch (err) {
    console.error(err);
  } finally {
    await db.$disconnect();
    process.exit(0);
  }
}

run();
