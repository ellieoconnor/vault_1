import { Request, Response, NextFunction } from "express";

/**
 * Catch-all api response for unhandled errors
 * @param err
 * @param req
 * @param res
 * @param _next
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    details: {},
  });
}
