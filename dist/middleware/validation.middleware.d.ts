import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
export interface ValidationRequest extends Request {
    validatedData?: Record<string, any>;
}
export declare class ValidationMiddleware {
    static validateBody(schema: ZodSchema): (req: ValidationRequest, res: Response, next: NextFunction) => Promise<void>;
    static validateQuery(schema: ZodSchema): (req: ValidationRequest, res: Response, next: NextFunction) => Promise<void>;
    static validateParams(schema: ZodSchema): (req: ValidationRequest, res: Response, next: NextFunction) => Promise<void>;
    private static handleValidationError;
}
//# sourceMappingURL=validation.middleware.d.ts.map