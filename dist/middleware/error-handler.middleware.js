"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandlerMiddleware = void 0;
const types_1 = require("../types");
const trace_id_1 = require("../utils/trace-id");
class ErrorHandlerMiddleware {
    static errorHandler() {
        return (err, req, res, next) => {
            const traceId = req.traceId || (0, trace_id_1.generateTraceId)();
            const timestamp = new Date().toISOString();
            const path = req.path;
            console.error(`[${timestamp}] [${traceId}] Error occurred:`, {
                name: err.name,
                message: err.message,
                statusCode: err instanceof types_1.ApiGatewayError ? err.statusCode : 500,
                path,
                stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
            });
            if (err instanceof types_1.ApiGatewayError) {
                const apiError = {
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
                const apiError = {
                    code: types_1.ErrorCode.INVALID_REQUEST,
                    message: "Invalid JSON in request body",
                    statusCode: 400,
                    timestamp,
                    path,
                    traceId,
                };
                return res.status(400).json(apiError);
            }
            const apiError = {
                code: types_1.ErrorCode.INTERNAL_SERVER_ERROR,
                message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
                statusCode: 500,
                details: process.env.NODE_ENV === "development"
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
    static notFoundHandler() {
        return (req, res) => {
            const traceId = req.traceId || (0, trace_id_1.generateTraceId)();
            const timestamp = new Date().toISOString();
            const apiError = {
                code: types_1.ErrorCode.NOT_FOUND,
                message: `Route not found: ${req.method} ${req.path}`,
                statusCode: 404,
                timestamp,
                path: req.path,
                traceId,
            };
            res.status(404).json(apiError);
        };
    }
    static requestMetadata() {
        return (req, res, next) => {
            req.traceId = req.headers["x-trace-id"] || (0, trace_id_1.generateTraceId)();
            const startTime = Date.now();
            res.on("finish", () => {
                const duration = Date.now() - startTime;
                console.log(`[${req.traceId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
            });
            res.setHeader("X-Trace-ID", req.traceId);
            next();
        };
    }
}
exports.ErrorHandlerMiddleware = ErrorHandlerMiddleware;
//# sourceMappingURL=error-handler.middleware.js.map