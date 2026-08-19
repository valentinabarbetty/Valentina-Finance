import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";

export const authRouter = Router();

/**
 * Minimal protected endpoint used to verify the complete browser → API JWT
 * flow. Its identity only comes from the token verified by authenticate.
 */
authRouter.get("/me", authenticate, (_request, response) => {
  const user = response.locals.authUser;

  response.status(200).json({
    id: user?.id,
    email: user?.email ?? null,
  });
});

//nj