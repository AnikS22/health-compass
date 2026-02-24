import { db } from "../db/client.js";

async function seed() {
  await db.query("SELECT 1");
  console.log("Database connection verified. Add project-specific seed data here.");
  await db.end();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
