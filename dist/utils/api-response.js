"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseHelper = void 0;
class ApiResponseHelper {
    static success(res, data, options) {
        const statusCode = options?.statusCode || 200;
        const message = options?.message || "Success";
        const response = {
            success: true,
            statusCode,
            message,
            data,
            timestamp: new Date().toISOString(),
            path: res.req.path,
            traceId: options?.traceId,
        };
        return res.status(statusCode).json(response);
    }
    static paginated(res, data, pagination, options) {
        const statusCode = options?.statusCode || 200;
        const message = options?.message || "Success";
        const response = {
            success: true,
            statusCode,
            message,
            data,
            pagination,
            timestamp: new Date().toISOString(),
            path: res.req.path,
            traceId: options?.traceId,
        };
        return res.status(statusCode).json(response);
    }
    static created(res, data, options) {
        return ApiResponseHelper.success(res, data, {
            statusCode: 201,
            message: options?.message || "Resource created successfully",
            traceId: options?.traceId,
        });
    }
    static noContent(res, options) {
        return res
            .status(204)
            .setHeader("X-Trace-ID", options?.traceId || "")
            .send();
    }
    static accepted(res, data, options) {
        return ApiResponseHelper.success(res, data, {
            statusCode: 202,
            message: options?.message || "Request accepted for processing",
            traceId: options?.traceId,
        });
    }
    static calculatePagination(total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        return {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
        };
    }
    static calculateOffset(page, limit) {
        return (page - 1) * limit;
    }
    static validatePaginationParams(page, limit) {
        const MIN_PAGE = 1;
        const MAX_LIMIT = 1000;
        const DEFAULT_LIMIT = 20;
        const validPage = Math.max(page, MIN_PAGE);
        const validLimit = Math.min(Math.max(limit || DEFAULT_LIMIT, 1), MAX_LIMIT);
        return { page: validPage, limit: validLimit };
    }
}
exports.ApiResponseHelper = ApiResponseHelper;
//# sourceMappingURL=api-response.js.map