import { NextFunction, Request, Response } from "express";
import { ValidationChain, validationResult } from "express-validator";

/**
 * Middleware that runs express-validator validations and handles errors
 * @param validations Array of express-validator validation chains
 * @returns Express middleware function
 */
const validate = (validations: ValidationChain[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      console.error({ errors: validation.array() });
      res.status(400).json({ errors: validation.array() });
      return;
    }

    next();
  };
};

export default validate;
