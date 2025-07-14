import express, { Response } from "express";
import { body, param } from "express-validator";
import {
  createPromptDb,
  deletePromptDb,
  readAllPromptsDb,
  updatePromptDb,
} from "../clients/db";
import validate from "../middlewares/validate";
import { AuthenticatedRequest } from "../types";

const router = express.Router();

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const result = await readAllPromptsDb();
  return res.json(result);
});

router.post(
  "/",
  validate([
    body("title").isString().notEmpty(),
    body("prompt").isString().notEmpty(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, prompt } = req.body;
    const result = await createPromptDb({
      title,
      prompt,
      created_by: req.user?.uiid,
    });

    if (result.error) {
      switch (result.error) {
        case "DUPLICATE_TITLE":
          return res.status(409).json({
            error: "DUPLICATE_TITLE",
            message: `A prompt with title "${title}" already exists.`,
          });

        case "SQLITE_CONSTRAINT":
          return res.status(409).json({
            error: "SQLITE_CONSTRAINT",
            message:
              "Database constraint violation. The prompt may already exist.",
          });

        default:
          return res.status(500).json({
            error: "UNKNOWN_ERROR",
            message: "Could not create prompt. Please check server logs.",
          });
      }
    }

    res.status(201).json({
      success: true,
      message: `Prompt "${title}" created successfully.`,
    });
  }
);

router.put(
  "/:title",
  validate([
    param("title").isString().notEmpty(),
    body("title").isString().optional(),
    body("prompt").isString().optional(),
    body("updated_by").isString().optional(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const currentTitle = req.params.title;
    const updateData = { ...req.body, updated_by: req.user?.uiid };

    const result = await updatePromptDb(currentTitle, updateData);

    if (!result.success) {
      switch (result.error) {
        case "PROMPT_NOT_FOUND":
          return res.status(404).json({
            error: "PROMPT_NOT_FOUND",
            message: `Prompt with title "${currentTitle}" not found.`,
          });

        case "DUPLICATE_TITLE":
          return res.status(409).json({
            error: "DUPLICATE_TITLE",
            message: `Cannot update: A prompt with title "${updateData.title}" already exists.`,
          });

        case "SQLITE_CONSTRAINT":
          return res.status(409).json({
            error: "SQLITE_CONSTRAINT",
            message:
              "Database constraint violation. The updated title may already be in use.",
          });

        default:
          return res.status(500).json({
            error: "UNKNOWN_ERROR",
            message: "Could not update prompt. Please check server logs.",
          });
      }
    }

    return res.json({
      success: true,
      message: `Prompt "${currentTitle}" updated successfully.`,
    });
  }
);

router.delete(
  "/:title",
  validate([param("title").isString().notEmpty()]),
  async (req: AuthenticatedRequest, res: Response) => {
    const title = req.params.title;

    const result = await deletePromptDb(title);

    if (!result) {
      return res
        .status(404)
        .json(
          `Prompt with title "${title}" not found or could not be deleted.`
        );
    }

    return res.json({
      success: true,
      message: `Prompt "${title}" deleted successfully.`,
    });
  }
);

export default router;
