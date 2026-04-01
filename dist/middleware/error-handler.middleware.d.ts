import { Request, Response, NextFunction } from "express";
import { ApiGatewayError } from "../types";
export interface ErrorRequest extends Request {
    traceId?: string;
}
export declare class ErrorHandlerMiddleware {
    static errorHandler(): (err: Error | ApiGatewayError, req: ErrorRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
    static notFoundHandler(): (req: ErrorRequest, res: Response) => void;
    static requestMetadata(): (req: ErrorRequest, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=error-handler.middleware.d.ts.map