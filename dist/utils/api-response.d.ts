import { Response } from "express";
import { PaginationMeta } from "../types";
export declare class ApiResponseHelper {
    static success<T>(res: Response, data: T, options?: {
        statusCode?: number;
        message?: string;
        traceId?: string;
    }): Response<any, Record<string, any>>;
    static paginated<T>(res: Response, data: T[], pagination: PaginationMeta, options?: {
        statusCode?: number;
        message?: string;
        traceId?: string;
    }): Response<any, Record<string, any>>;
    static created<T>(res: Response, data: T, options?: {
        message?: string;
        traceId?: string;
    }): Response<any, Record<string, any>>;
    static noContent(res: Response, options?: {
        traceId?: string;
    }): Response<any, Record<string, any>>;
    static accepted<T>(res: Response, data?: T, options?: {
        message?: string;
        traceId?: string;
    }): Response<any, Record<string, any>>;
    static calculatePagination(total: number, page: number, limit: number): PaginationMeta;
    static calculateOffset(page: number, limit: number): number;
    static validatePaginationParams(page: number, limit: number): {
        page: number;
        limit: number;
    };
}
//# sourceMappingURL=api-response.d.ts.map