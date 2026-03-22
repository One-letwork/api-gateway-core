/**
 * Global Error Handler Middleware
 * Centralized error handling for the API Gateway
 */

import { Request, Response, NextFunction } from "express";
import { ApiGatewayError, ErrorCode, ApiError } from "../types";
import { generateTraceId } from "../utils/trace-id";

export interface ErrorRequest extends Request {
  traceId?: string;
}

export class ErrorHandlerMiddleware {
  /**
   * Global error handler middleware
   */
  static errorHandler() {
    return (err: Error | ApiGatewayError, req: ErrorRequest, res: Response, next: NextFunction) => {
      const traceId = req.traceId || generateTraceId();
      const timestamp = new Date().toISOString();
      const path = req.path;

      console.error(
        `[${timestamp}] [${traceId}] Error occurred:`,
        {
          name: err.name,
          message: err.message,
          statusCode: err instanceof ApiGatewayError ? err.statusCode : 500,
          path,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        }
      );

      if (err instanceof ApiGatewayError) {
        const apiError: ApiError = {
          code: err.code,
          message: err.message,
          statusCode: err.statusCode,
          details: err.details,
          timestamp,
          path,
          traceId,
        };

        return res.status(err.statusCode).json(apiError);
      }

      if (err instanceof SyntaxError && "body" in err) {
        const apiError: ApiError = {
          code: ErrorCode.INVALID_REQUEST,
          message: "Invalid JSON in request body",
          statusCode: 400,
          timestamp,
          path,
          traceId,
        };

        return res.status(400).json(apiError);
      }

      const apiError: ApiError = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
        statusCode: 500,
        details:
          process.env.NODE_ENV === "development"
            ? {
                errorType: err.constructor.name,
                stack: err.stack?.split("\n"),
              }
            : undefined,
        timestamp,
        path,
        traceId,
      };

      return res.status(500).json(apiError);
    };
  }

  /**
   * 404 Not Found handler
   */
  static notFoundHandler() {
    return (req: ErrorRequest, res: Response) => {
      const traceId = req.traceId || generateTraceId();
      const timestamp = new Date().toISOString();

      const apiError: ApiError = {
        code: ErrorCode.NOT_FOUND,
        message: `Route not found: ${req.method} ${req.path}`,
        statusCode: 404,
        timestamp,
        path: req.path,
        traceId,
      };

      res.status(404).json(apiError);
    };
  }

  /**
   * Request timing and trace ID middleware
   */
  static requestMetadata() {
    return (req: ErrorRequest, res: Response, next: NextFunction) => {
      req.traceId = (req.headers["x-trace-id"] as string) || generateTraceId();
      const startTime = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - startTime;
        console.log(
          `[${req.traceId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
        );
      });

      res.setHeader("X-Trace-ID", req.traceId);
      next();
    };
  }
}
