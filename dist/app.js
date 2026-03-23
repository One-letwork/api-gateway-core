"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppFactory = void 0;
const express_1 = __importDefault(require("express"));
const error_handler_middleware_1 = require("./middleware/error-handler.middleware");
class AppFactory {
    static createApp(config = {}) {
        const app = (0, express_1.default)();
        const { nodeEnv = process.env.NODE_ENV || "development", enableCors = true, enableCompression = true, enableRequestLogging = true, trustedProxies = ["loopback"], bodyLimit = "1mb", jsonLimit = "1mb", urlLimit = "1mb", } = config;
        if (trustedProxies.length > 0) {
            app.set("trust proxy", trustedProxies);
        }
        app.use(express_1.default.json({ limit: jsonLimit }));
        app.use(express_1.default.urlencoded({ limit: urlLimit, extended: true }));
        if (enableCors) {
            const cors = require("cors");
            app.use(cors({
                origin: process.env.CORS_ORIGIN || "*",
                credentials: true,
                methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                allowedHeaders: ["Content-Type", "Authorization", "X-Trace-ID", "X-Request-ID"],
                exposedHeaders: ["X-Trace-ID", "X-Total-Count", "X-Page", "X-Limit"],
                maxAge: 86400,
            }));
        }
        if (enableCompression) {
            const compression = require("compression");
            app.use(compression());
        }
        app.use(error_handler_middleware_1.ErrorHandlerMiddleware.requestMetadata());
        if (enableRequestLogging) {
            app.use((req, res, next) => {
                const traceId = req.traceId || "";
                console.log(`[${traceId}] Incoming ${req.method} ${req.path}`);
                next();
            });
        }
        app.get("/health", (req, res) => {
            res.json({
                status: "ok",
                timestamp: new Date().toISOString(),
                environment: nodeEnv,
            });
        });
        app.get("/api/version", (req, res) => {
            res.json({
                version: process.env.API_VERSION || "1.0.0",
                timestamp: new Date().toISOString(),
            });
        });
        return app;
    }
    static setupErrorHandling(app) {
        app.use(error_handler_middleware_1.ErrorHandlerMiddleware.notFoundHandler());
        app.use(error_handler_middleware_1.ErrorHandlerMiddleware.errorHandler());
        return app;
    }
    static startServer(app, port) {
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
exports.AppFactory = AppFactory;
//# sourceMappingURL=app.js.map