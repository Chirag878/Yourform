import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, { schema }); 