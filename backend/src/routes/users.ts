import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import {
  createUserDb,
  findUserByEmailDb,
  getTotalRecentlyAddedUsersDb,
  getTotalUsersDb,
} from "../clients/db";
import { config } from "../config/config";
import { hashPassword, verifyPassword } from "../encryption";
import { authenticateCookie } from "../middlewares/authenticate";
import validate from "../middlewares/validate";
import { JwtPayload } from "../types/interfaces";

const router = express.Router();

router.post(
  "/register",
  validate([
    body("name").isString().isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isString(),
    body("confirmPassword").isString(),
  ]),
  async (req: Request, res: Response) => {
    const body = req.body;

    const passwordHash = await hashPassword(body.password);
    try {
      const result = await createUserDb(body.name, body.email, passwordHash);
      if (!result) {
        throw Error("Unknown error");
      }
      res.json({
        status: "success",
        message: "Your registration request has been processed",
      });
    } catch (error: any) {
      if (error.message === "email taken") {
        res.json({
          status: "failure",
          message: "Email address is already registered",
        });
      } else {
        res.json({
          status: "failure",
          message: "Unknown error occured",
        });
      }
    }
  }
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").isString()],
  async (req: Request, res: Response) => {
    // can't use validate middleware here, need to return status: "failure"
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      return res.status(400).send({
        status: "failure",
        message: "Invalid request",
        errors: validation.array(),
      });
    }

    try {
      const { email, password } = req.body;

      const user = await findUserByEmailDb(email);

      const isValid = user
        ? await verifyPassword(password, user.password_hash)
        : false;

      if (!user || !isValid) {
        return res.status(401).json({
          status: "failure",
          message: "Invalid credentials",
        });
      }

      if (config.env === "production") {
        const isActive = user.status === "active";

        if (!isActive) {
          return res.status(401).json({
            status: "failure",
            message: "Account inactive",
          });
        }
      }
      const payload: JwtPayload = {
        name: user.username,
        email: user.email,
      };

      const token = jwt.sign(payload, Buffer.from(config.jwt.secret), {
        expiresIn: config.jwt.expiration,
      });

      const decodedToken = jwt.verify(
        token,
        Buffer.from(config.jwt.secret)
      ) as jwt.JwtPayload;

      res.cookie("auth_token", token, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: config.jwt.expiration * 1000,
        path: "/",
      });

      return res.status(200).json({
        status: "success",
        message: "Authentication successful",
        user: {
          name: user.username,
          email: user.email,
          expires: decodedToken.exp,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        status: "failure",
        message: "Authentication error",
      });
    }
  }
);

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res.status(200).json({
    status: "success",
    message: "Logout successful",
  });
});

router.get(
  "/statistics",
  authenticateCookie,
  async (_req: Request, res: Response) => {
    try {
      const totalUsers = await getTotalUsersDb();
      const recentlyAddedUsers = await getTotalRecentlyAddedUsersDb();
      res.status(200).json({
        status: "success",
        data: {
          totalUsers,
          recentlyAddedUsers,
        },
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({
        status: "failure",
        message: "Unable to fetch statistics",
      });
    }
  }
);

export default router;
