import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { env } from "./env";
import type { Role } from "@prisma/client";

const secretKey = new TextEncoder().encode(env.jwtSecret);
const SESSION_DAYS = 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  image: string | null;
};

// ── Passwords ────────────────────────────────────────────────
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// ── JWT tokens ───────────────────────────────────────────────
export async function createToken(payload: SessionUser) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: (payload.name as string) ?? null,
      role: (payload.role as Role) ?? "USER",
      image: (payload.image as string) ?? null,
    };
  } catch {
    return null;
  }
}

// ── Cookie-backed session ────────────────────────────────────
export async function startSession(user: SessionUser) {
  const token = await createToken(user);
  const jar = await cookies();
  jar.set(env.sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(env.sessionCookie);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(env.sessionCookie)?.value;
  if (!token) return null;
  const fromJwt = await verifyToken(token);
  if (!fromJwt) return null;
  // Re-read from DB so role/suspension changes take effect immediately.
  const fresh = await db.user.findUnique({ where: { id: fromJwt.id } });
  if (!fresh || fresh.suspended) return null;
  return {
    id: fresh.id,
    email: fresh.email,
    name: fresh.name,
    role: fresh.role,
    image: fresh.image,
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Unauthorized", 401);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AuthError("Forbidden", 403);
  return user;
}

export class AuthError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "AuthError";
  }
}

export function toPublicUser(u: SessionUser) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, image: u.image };
}
