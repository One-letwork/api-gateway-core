export interface ApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    timestamp: string;
    path: string;
    traceId?: string;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: PaginationMeta;
}
export interface ApiError {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, any>;
    timestamp: string;
    path?: string;
    traceId?: string;
}
export interface ValidationError extends ApiError {
    validationErrors: Array<{
        field: string;
        message: string;
        code?: string;
    }>;
}
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    BAD_GATEWAY = "BAD_GATEWAY",
    GATEWAY_TIMEOUT = "GATEWAY_TIMEOUT",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INVALID_REQUEST = "INVALID_REQUEST"
}
export declare class ApiGatewayError extends Error {
    code: ErrorCode | string;
    statusCode: number;
    details?: Record<string, any> | undefined;
    constructor(code: ErrorCode | string, statusCode: number, message: string, details?: Record<string, any> | undefined);
}
export interface RequestContext {
    traceId: string;
    userId?: string;
    correlationId?: string;
    timestamp: Date;
    userAgent?: string;
    ip?: string;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
export interface FilterParams {
    [key: string]: string | number | boolean | string[] | undefined;
}
export type FilterOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains" | "regex";
export interface FilterCondition {
    field: string;
    operator: FilterOperator;
    value: any;
}
export interface SortCondition {
    field: string;
    order: "asc" | "desc";
}
//# sourceMappingURL=index.d.ts.map