import bcryptjs from "bcryptjs";
import { GraphQLError } from "graphql";
import { createCookieSessionStorage } from "remix";
import { Context } from "remix-graphql/index.server";
import { db } from "./db.server";
import { ErrorCode } from "./error-codes";

type LoginForm = { username: string; password: string };

export async function register({ username, password }: LoginForm) {
  const passwordHash = await bcryptjs.hash(password, 10);
  return db.user.create({ data: { username, passwordHash } });
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;

  const isPasswordCorrect = await bcryptjs.compare(password, user.passwordHash);
  if (!isPasswordCorrect) return null;

  return user;
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(
  ctx: Context,
  redirectTo: string = new URL(ctx.request.url).pathname
) {
  const session = await getUserSession(ctx.request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    ctx.redirect(`/login?${searchParams}`);
    throw new GraphQLError(
      "You have to be logged in for that",
      undefined, // nodes
      undefined, // source
      undefined, // positions
      undefined, // path
      undefined, // originalError
      { code: ErrorCode.UNAUTHORIZED, status: 401 }
    );
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") return null;

  const user = await db.user.findUnique({ where: { id: userId } });
  return user;
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return storage.destroySession(session);
}

export async function createUserSession(userId: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return storage.commitSession(session);
}
