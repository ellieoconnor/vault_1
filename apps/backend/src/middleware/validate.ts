import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

/**
 * Check if request is valid
 * @param schema
 * @returns
 */
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. run schema.safeParse() on req.body
    const result = schema.safeParse(req.body);
    // 2. if it fails -> send 400 with error details
    if (!result.success) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: result.error.flatten().fieldErrors,
      });
    } else {
      req.body = result.data;
      next();
    }
  };
}
