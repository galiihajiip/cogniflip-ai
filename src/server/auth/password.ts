import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with scrypt (memory-hard, built into Node).
 * Format: scrypt$N$r$p$saltB64url$hashB64url. Parameters are stored per hash
 * so they can be raised later without breaking existing accounts.
 */
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const MAXMEM = 64 * 1024 * 1024;

function derive(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password.normalize("NFC"),
      salt,
      KEY_LENGTH,
      { N: n, r, p, maxmem: MAXMEM },
      (err, key) => (err ? reject(err) : resolve(key)),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [n, r, p] = parts.slice(1, 4).map(Number);
  if (![n, r, p].every(Number.isInteger) || n > 2 ** 20) return false;
  const expected = Buffer.from(parts[5], "base64url");
  const actual = await derive(
    password,
    Buffer.from(parts[4], "base64url"),
    n,
    r,
    p,
  );
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * A real hash of a random password, computed once. Verifying against it
 * when a handle does not exist keeps login timing similar for existing and
 * non-existing accounts.
 */
let dummy: Promise<string> | undefined;
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword(randomBytes(16).toString("hex"));
  return dummy;
}
