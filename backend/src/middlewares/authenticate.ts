import type { NextFunction, Request, Response } from "express";
import { getSupabaseAuthClient } from "../config/supabase.js";

/**
 * Verifies the bearer token with Supabase Auth and exposes its immutable `sub`
 * value as `res.locals.userId`. Future services must always filter writes and
 * reads using this value; a Prisma connection does not receive auth.uid().
 */
export async function authenticate(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = request.header("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  if (!token) {
    response.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    const { data, error } = await getSupabaseAuthClient().auth.getUser(token);

    if (error || !data.user) {
      response.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    response.locals.userId = data.user.id;
    response.locals.authUser = data.user;
    next();
  } catch (error) {
    next(error);
  }
}
