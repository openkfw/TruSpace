import express from "express";
import { body } from "express-validator";

export const permissionsRouter = express.Router();

permissionsRouter.post(
  "/",
  express.json(),
  validate([
    body("email").isString().notEmpty(),
    body("workspaceId").isString().notEmpty(),
  ]),
  
);

permissionsRouter.get(
  "/users-in-workspace/:workspaceId",
  
);

permissionsRouter.delete(
  "/users-in-workspace/remove/:permissionId",
  
);


