"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = void 0;
const zod_1 = require("zod");
class ValidationMiddleware {
    static validateBody(schema) {
        return async (req, res, next) => {
            try {
                const validatedData = await schema.parseAsync(req.body);
                req.validatedData = { ...req.validatedData, body: validatedData };
                req.body = validatedData;
                next();
            }
            catch (error) {
                ValidationMiddleware.handleValidationError(error, res);
            }
        };
    }
    static validateQuery(schema) {
        return async (req, res, next) => {
            try {
                const validatedData = await schema.parseAsync(req.query);
                req.validatedData = { ...req.validatedData, query: validatedData };
                req.query = validatedData;
                next();
            }
            catch (error) {
                ValidationMiddleware.handleValidationError(error, res);
            }
        };
    }
    static validateParams(schema) {
        return async (req, res, next) => {
            try {
                const validatedData = await schema.parseAsync(req.params);
                req.validatedData = { ...req.validatedData, params: validatedData };
                req.params = validatedData;
                next();
            }
            catch (error) {
                ValidationMiddleware.handleValidationError(error, res);
            }
        };
    }
    static handleValidationError(error, res) {
        if (error instanceof zod_1.ZodError) {
            const validationErrors = error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
            }));
            const apiError = {
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
exports.ValidationMiddleware = ValidationMiddleware;
//# sourceMappingURL=validation.middleware.js.map