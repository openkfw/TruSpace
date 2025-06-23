import express, { Request, Response } from "express";
import { body, query, validationResult } from "express-validator";
import fs from "fs";
import { compile } from "handlebars";
import jwt from "jsonwebtoken";
import path from "path";
import {
  activateUserDb,
  createUserDb,
  findUserByEmailDb,
  findUserByTokenDb,
  getTotalRecentlyAddedUsersDb,
  getTotalUsersDb,
} from "../clients/db";
import { config } from "../config/config";
import logger from "../config/winston";
import { hashPassword, verifyPassword } from "../encryption";
import { sendEmail } from "../mailing/mailing";
import { registrationConfirmation } from "../mailing/mailingConstants";
import { authenticateCookie } from "../middlewares/authenticate";
import validate from "../middlewares/validate";
import { JwtPayload } from "../types/interfaces";
import { USER_STATUS } from "../utility/constants";

const router = express.Router();

router.post(
  "/register",
  validate([
    body("name").isString().isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isString(),
    body("confirmPassword").isString(),
    body("confirmationLink").isString(),
    body("lang").isString(),
  ]),
  async (req: Request, res: Response) => {
    const { name, email, password, confirmationLink, lang } = req.body;
    const { registerUsersAsInactive } = config;

    const passwordHash = await hashPassword(password);
    const token = jwt.sign({ email: email }, Buffer.from(config.jwt.secret), {
      expiresIn: 1200000,
    });
    try {
      const result = await createUserDb(
        name,
        email,
        passwordHash,
        registerUsersAsInactive ? USER_STATUS.inactive : USER_STATUS.active,
        token
      );
      if (!result) {
        throw Error("Unknown error");
      }
      if (registerUsersAsInactive) {
        const filePath = path.join(
          process.cwd(),
          "src/mailing/templates/registrationConfirmation.html"
        );
        const source = fs.readFileSync(filePath, "utf-8");
        const template = compile(source);
        const replacements = {
          lang: lang,
          header: registrationConfirmation[lang].header,
          user: name,
          text: registrationConfirmation[lang].text,
          confirmRegistrationUrl: `${confirmationLink}?token=${token}`,
          confirmRegistrationTitle: registrationConfirmation[lang].link,
          footer: registrationConfirmation[lang].footer,
        };
        const htmlTemplateToSend = template(replacements);

        await sendEmail(
          email,
          registrationConfirmation[lang].subject,
          htmlTemplateToSend
        );
        res.json({
          status: "success",
          message: "email sent",
        });
      } else {
        res.json({
          status: "success",
          message: "Your registration request has been processed",
        });
      }
    } catch (error: any) {
      logger.error(error);
      if (error.message === "email taken") {
        res.status(400).json({
          status: "failure",
          message: "Email address is already registered",
        });
      } else {
        res.status(500).json({
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
        const isActive = user.status === USER_STATUS.active;

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

router.get(
  "/confirm-registration",
  validate([query("token").isString().notEmpty()]),
  async (req: Request, res: Response) => {
    const token = req.query.token as string;
    const user = await findUserByTokenDb(token);
    if (user) {
      await activateUserDb(user.id);
      res.status(200).json({
        status: "success",
        message: "User activated successfully",
      });
    } else {
      res.status(400).json({
        status: "failure",
        message: "Invalid token",
      });
    }
  }
);

export default router;
