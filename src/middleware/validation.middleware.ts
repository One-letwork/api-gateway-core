/**
 * Zod-based Request Validation Middleware
 * Validates request body, params, and query parameters
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../types";

export interface ValidationRequest extends Request {
  validatedData?: Record<string, any>;
}

export class ValidationMiddleware {
  /**
   * Creates middleware to validate request body
   */
  static validateBody(schema: ZodSchema) {
    return async (req: ValidationRequest, res: Response, next: NextFunction) => {
      try {
        const validatedData = await schema.parseAsync(req.body);
        req.validatedData = { ...req.validatedData, body: validatedData };
        req.body = validatedData;
        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, res);
      }
    };
  }

  /**
   * Creates middleware to validate request query
   */
  static validateQuery(schema: ZodSchema) {
    return async (req: ValidationRequest, res: Response, next: NextFunction) => {
      try {
        const validatedData = await schema.parseAsync(req.query);
        req.validatedData = { ...req.validatedData, query: validatedData };
        req.query = validatedData as any;
        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, res);
      }
    };
  }

  /**
   * Creates middleware to validate request params
   */
  static validateParams(schema: ZodSchema) {
    return async (req: ValidationRequest, res: Response, next: NextFunction) => {
      try {
        const validatedData = await schema.parseAsync(req.params);
        req.validatedData = { ...req.validatedData, params: validatedData };
        req.params = validatedData;
        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, res);
      }
    };
  }

  /**
   * Handles validation errors and sends formatted response
   */
  private static handleValidationError(error: any, res: Response) {
    if (error instanceof ZodError) {
      const validationErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));

      const apiError: ValidationError = {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        statusCode: 400,
        validationErrors,
        timestamp: new Date().toISOString(),
      };

      return res.status(400).json(apiError);
    }

    return res.status(400).json({
      code: "INVALID_REQUEST",
      message: "Invalid request",
      statusCode: 400,
      timestamp: new Date().toISOString(),
    });
  }
}
