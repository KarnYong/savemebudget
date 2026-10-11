// Creates the database if missing, then applies db/schema.sql (idempotent). Never drops or resets.
import { readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const target = new URL(url);
const dbName = decodeURIComponent(target.pathname.slice(1));
const admin = new URL(url);
admin.pathname = "/postgres";

const adminClient = new pg.Client({ connectionString: admin.toString() });
await adminClient.connect();
const { rowCount } = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
if (!rowCount) {
  await adminClient.query(`CREATE DATABASE "${dbName.replaceAll('"', '""')}"`);
  console.log(`Created database ${dbName}`);
}
await adminClient.end();

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
await client.end();
console.log(`Schema applied to ${dbName}`);
