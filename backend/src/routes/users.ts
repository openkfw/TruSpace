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
  storeUserSettingsDb,
  updateUserPassword,
} from "../clients/db";
import { config } from "../config/config";
import logger from "../config/winston";
import { hashPassword, verifyPassword } from "../encryption";
import { sendEmail } from "../mailing/mailing";
import {
  registrationConfirmation,
  passwordReset,
} from "../mailing/mailingConstants";
import { authenticateCookie } from "../middlewares/authenticate";
import validate from "../middlewares/validate";
import { JwtPayload } from "../types/interfaces";
import { USER_STATUS } from "../utility/constants";
import { AuthenticatedRequest } from "../types";
import { IpfsClient } from "../clients/ipfs-client";
import { UploadedFile } from "express-fileupload";
import {
  createTokenDb,
  getTokenDb,
  removeTokensOfUserDb,
} from "../clients/db/resetPasswordTokens";
import { getUserSettings } from "../utility/user";

const router = express.Router();
logger.info("Registering user");

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
      expiresIn: 1200, // 20 minutes
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
      logger.info("Register user as inactive");
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
        logger.info("Sending email done");
        await sendEmail(
          email,
          registrationConfirmation[lang].subject,
          htmlTemplateToSend
        );
        logger.info("Sending email done");
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
          message: "Unknown error occurred",
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

      const isActive = user.status === USER_STATUS.active;

      if (!isActive) {
        return res.status(401).json({
          status: "failure",
          message: "Account inactive",
        });
      }

      const payload: JwtPayload = {
        name: user.username,
        email: user.email,
        uiid: user.uiid,
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
          uiid: user.uiid,
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
    jwt.verify(token, Buffer.from(config.jwt.secret)) as jwt.JwtPayload;
    try {
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
    } catch (error: any) {
      logger.error(error);
      if (
        error.message === "jwt expired" ||
        error.message === "invalid signature"
      ) {
        res.status(400).json({
          status: "error",
          message: "invalid token",
        });
      } else {
        res.status(500).json({
          status: "failure",
          message: "Unknown error occurred",
        });
      }
    }
  }
);

router.get(
  "/user-settings",
  authenticateCookie,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userSettings = await getUserSettings(req.user?.email as string);
      if (!userSettings) {
        return res.status(404).json({
          status: "failure",
          message: "User not found",
        });
      }
      return res.json({
        status: "success",
        data: {
          ...userSettings,
        },
      });
    } catch (error) {
      logger.error(
        `Error fetching user settings: ${JSON.stringify(error, null, 2)}`
      );
      res.status(500).json({
        status: "failure",
        message: "User settings fetch failed",
      });
    }
  }
);

router.post(
  "/user-settings",
  authenticateCookie,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req?.files?.file as UploadedFile;

      let avatarCid: string | undefined = undefined;
      if (file) {
        const client = new IpfsClient();
        avatarCid = await client.uploadAvatar(file);
      }

      const addedToWorkspace = req.body.notificationAddedToWorkspace === "true";
      const documentChanged = req.body.notificationDocumentChanged === "true";
      const documentChat = req.body.notificationDocumentChat === "true";
      const workspaceChange = req.body.notificationWorkspaceChange === "true";
      const preferedLanguage = req.body.preferedLanguage || "en";

      const notificationSettings = {
        addedToWorkspace,
        documentChanged,
        documentChat,
        workspaceChange,
      };

      await storeUserSettingsDb(req.user?.email as string, {
        avatarCid,
        preferedLanguage,
        notificationSettings: JSON.stringify(notificationSettings),
      });
      return res.json({
        status: "success",
        message: "User settings updated successfully",
      });
    } catch (error) {
      logger.error(`Error uploading avatar: ${JSON.stringify(error, null, 2)}`);
      res.status(500).json({
        status: "failure",
        message: "User settings update failed",
      });
    }
  }
);

router.get(
  "/avatar",
  authenticateCookie,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await findUserByEmailDb(req.user?.email as string);
    const cid = user?.avatar_cid;
    if (!cid) {
      return res
        .status(404)
        .json({ status: "failure", message: "Could not find avatar" });
    }
    return new IpfsClient().downloadAvatar(req, res, cid);
  }
);

router.post(
  "/forgot-password",
  validate([
    body("email").isEmail(),
    body("resetPasswordLink").isString(),
    body("lang").isString(),
  ]),
  async (req: Request, res: Response) => {
    const { email, resetPasswordLink, lang } = req.body;
    const { smtpServer } = config;

    if (!smtpServer.host || !smtpServer.port) {
      logger.error("SMTP server not set");
      return res.status(500).json({
        status: "error",
        message: "SMTP server not set",
      });
    }

    try {
      const user = await findUserByEmailDb(email);
      if (!user) {
        logger.info("No such user");
        return res.status(200).json({
          status: "success",
          message: "email sent",
        });
      }
      const token = jwt.sign({ email: email }, Buffer.from(config.jwt.secret), {
        expiresIn: 1200, // 20 minutes
      });
      await createTokenDb(user.id, token);
      const filePath = path.join(
        process.cwd(),
        "src/mailing/templates/resetPasswordEmail.html"
      );
      const source = fs.readFileSync(filePath, "utf-8");
      const template = compile(source);
      const replacements = {
        lang: lang,
        header: passwordReset[lang].header,
        user: user.username,
        text: passwordReset[lang].text,
        resetPasswordUrl: `${resetPasswordLink}?token=${token}`,
        resetPasswordUrlTitle: passwordReset[lang].link,
        footer: passwordReset[lang].footer,
      };
      const htmlTemplateToSend = template(replacements);

      await sendEmail(email, passwordReset[lang].subject, htmlTemplateToSend);
      res.json({
        status: "success",
        message: "email sent",
      });
    } catch (error: any) {
      logger.error(error);
      res.status(500).json({
        status: "failure",
        message: "Unknown error occurred",
      });
    }
  }
);

router.post(
  "/reset-password",
  validate([body("password").isString(), body("token").isString()]),
  async (req: Request, res: Response) => {
    const { password, token } = req.body;

    try {
      jwt.verify(token, Buffer.from(config.jwt.secret)) as jwt.JwtPayload;
      const result = await getTokenDb(token);

      if (!result) {
        logger.error("invalid token");
        return res.status(400).json({
          status: "error",
          message: "invalid token",
        });
      }

      const passwordHash = await hashPassword(password);
      await updateUserPassword(result.user_id, passwordHash);
      await removeTokensOfUserDb(result.user_id);
      res.json({
        status: "success",
        message: "password set",
      });
    } catch (error: any) {
      logger.error(error);
      if (
        error.message === "jwt expired" ||
        error.message === "invalid signature"
      ) {
        res.status(400).json({
          status: "error",
          message: "invalid token",
        });
      } else {
        res.status(500).json({
          status: "failure",
          message: "Unknown error occurred",
        });
      }
    }
  }
);

export default router;
