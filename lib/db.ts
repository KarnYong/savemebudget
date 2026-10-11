// Data layer. Every expense query is scoped by user_id; callers must pass the
// id from the verified session (lib/session.ts), never one taken from client input.
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";
import type { Category } from "./validation";

const g = globalThis as unknown as { pgPool?: pg.Pool };
export const pool = (g.pgPool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 }));

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Returns the new user id, or null if the email is taken. */
export async function createUser(email: string, password: string) {
  const { rows } = await pool.query<{ id: string }>(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING RETURNING id",
    [email, await hashPassword(password)],
  );
  return rows[0]?.id ?? null;
}

/** Returns the user id if the credentials match, else null. */
export async function authenticate(email: string, password: string) {
  const { rows } = await pool.query<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email],
  );
  // ponytail: unknown emails skip scrypt, so timing hints whether an email exists; add a dummy verify if that matters.
  if (!rows[0] || !(await verifyPassword(password, rows[0].password_hash))) return null;
  return rows[0].id;
}

export const SESSION_DAYS = 30;

/** Creates a session and returns the raw token (only its hash is stored). */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await pool.query("DELETE FROM sessions WHERE expires_at < now()");
  await pool.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '${SESSION_DAYS} days')`,
    [sha256(token), userId],
  );
  return token;
}

export async function findSessionUser(token: string) {
  const { rows } = await pool.query<{ id: string; email: string }>(
    `SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
  return rows[0] ?? null;
}

export async function deleteSession(token: string) {
  await pool.query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
}

export type Expense = {
  id: string;
  description: string;
  amount: string;
  category: Category;
  spentOn: string;
};

export async function addExpense(
  userId: string,
  e: { description: string; amount: string; category: Category; spentOn: string },
) {
  await pool.query(
    "INSERT INTO expenses (user_id, description, amount, category, spent_on) VALUES ($1, $2, $3, $4, $5)",
    [userId, e.description, e.amount, e.category, e.spentOn],
  );
}

/** Returns true if a row was deleted (false if missing or owned by someone else). */
export async function deleteExpense(userId: string, expenseId: number) {
  const { rowCount } = await pool.query("DELETE FROM expenses WHERE id = $1 AND user_id = $2", [
    expenseId,
    userId,
  ]);
  return rowCount === 1;
}

export async function recentExpenses(userId: string, limit = 10) {
  const { rows } = await pool.query<Expense>(
    `SELECT id, description, amount::text AS amount, category, spent_on::text AS "spentOn"
     FROM expenses WHERE user_id = $1 ORDER BY spent_on DESC, id DESC LIMIT $2`,
    [userId, limit],
  );
  return rows;
}

/** Current Bangkok calendar month: total plus per-category breakdown (largest first). */
export async function monthSummary(userId: string) {
  const { rows } = await pool.query<{ category: Category | null; total: string }>(
    `WITH m AS (SELECT date_trunc('month', now() AT TIME ZONE 'Asia/Bangkok')::date AS start)
     SELECT category, sum(amount)::text AS total
     FROM expenses, m
     WHERE user_id = $1 AND spent_on >= m.start AND spent_on < m.start + interval '1 month'
     GROUP BY ROLLUP (category)
     ORDER BY sum(amount) DESC`,
    [userId],
  );
  // ROLLUP's grand-total row has category NULL; exact numeric sum from Postgres.
  const total = rows.find((r) => r.category === null)?.total ?? "0";
  const byCategory = rows.filter((r) => r.category !== null) as { category: Category; total: string }[];
  return { total, byCategory };
}
