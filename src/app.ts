/**
 * Express Application Factory
 * Creates and configures the Express application
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import { ErrorHandlerMiddleware } from "./middleware/error-handler.middleware";

export interface AppConfig {
  port?: number;
  nodeEnv?: "development" | "production" | "test";
  enableCors?: boolean;
  enableCompression?: boolean;
  enableRequestLogging?: boolean;
  trustedProxies?: string[];
  jsonLimit?: string;
  urlLimit?: string;
}

export class AppFactory {
  /**
   * Create and configure Express app
   */
  static createApp(config: AppConfig = {}): Express {
    const app = express();

    const {
      nodeEnv = process.env.NODE_ENV || "development",
      enableCors = true,
      enableCompression = true,
      enableRequestLogging = true,
      trustedProxies = ["loopback"],
      jsonLimit = "1mb",
      urlLimit = "1mb",
    } = config;

    // Trust proxy
    if (trustedProxies.length > 0) {
      app.set("trust proxy", trustedProxies);
    }

    // Body parsing middleware
    app.use(express.json({ limit: jsonLimit }));
    app.use(express.urlencoded({ limit: urlLimit, extended: true }));

    // CORS
    if (enableCors) {
      app.use(
        cors({
          origin: process.env.CORS_ORIGIN || "*",
          credentials: true,
          methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization", "X-Trace-ID", "X-Request-ID"],
          exposedHeaders: ["X-Trace-ID", "X-Total-Count", "X-Page", "X-Limit"],
          maxAge: 86400,
        })
      );
    }

    // Compression
    if (enableCompression) {
      app.use(compression());
    }

    // Request metadata (trace ID, timing)
    app.use(ErrorHandlerMiddleware.requestMetadata());

    // Request logging
    if (enableRequestLogging) {
      app.use((req: Request, res: Response, next: NextFunction) => {
        const traceId = (req as any).traceId || "";
        console.log(`[${traceId}] Incoming ${req.method} ${req.path}`);
        next();
      });
    }

    // Health check endpoint
    app.get("/health", (req: Request, res: Response) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: nodeEnv,
      });
    });

    // API version endpoint
    app.get("/api/version", (req: Request, res: Response) => {
      res.json({
        version: process.env.API_VERSION || "1.0.0",
        timestamp: new Date().toISOString(),
      });
    });

    return app;
  }

  /**
   * Setup global error handlers
   */
  static setupErrorHandling(app: Express): Express {
    // 404 handler - must be after all routes
    app.use(ErrorHandlerMiddleware.notFoundHandler());

    // Global error handler - must be last
    app.use(ErrorHandlerMiddleware.errorHandler());

    return app;
  }

  /**
   * Start server
   */
  static startServer(app: Express, port?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverPort = port || parseInt(process.env.PORT || "3000");
      const server = app.listen(serverPort, () => {
        console.log(`API Gateway listening on port ${serverPort}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        resolve();
      });

      server.on("error", (err) => {
        console.error("Server error:", err);
        reject(err);
      });

      // Graceful shutdown
      process.on("SIGTERM", () => {
        console.log("SIGTERM received, shutting down gracefully");
        server.close(() => {
          console.log("Server closed");
          process.exit(0);
        });
      });

      process.on("SIGINT", () => {
        console.log("SIGINT received, shutting down gracefully");
        server.close(() => {
          console.log("Server closed");
          process.exit(0);
        });
      });
    });
  }
}
