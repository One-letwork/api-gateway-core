/**
 * API Response Helper Utilities
 * Provides consistent response formatting across the API
 */

import { Response } from "express";
import { ApiResponse, PaginatedResponse, PaginationMeta } from "../types";

export class ApiResponseHelper {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data: T,
    options?: {
      statusCode?: number;
      message?: string;
      traceId?: string;
    }
  ) {
    const statusCode = options?.statusCode || 200;
    const message = options?.message || "Success";

    const response: ApiResponse<T> = {
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

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    options?: {
      statusCode?: number;
      message?: string;
      traceId?: string;
    }
  ) {
    const statusCode = options?.statusCode || 200;
    const message = options?.message || "Success";

    const response: PaginatedResponse<T> = {
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

  /**
   * Send created response (201)
   */
  static created<T>(
    res: Response,
    data: T,
    options?: {
      message?: string;
      traceId?: string;
    }
  ) {
    return ApiResponseHelper.success(res, data, {
      statusCode: 201,
      message: options?.message || "Resource created successfully",
      traceId: options?.traceId,
    });
  }

  /**
   * Send no content response (204)
   */
  static noContent(
    res: Response,
    options?: {
      traceId?: string;
    }
  ) {
    return res
      .status(204)
      .setHeader("X-Trace-ID", options?.traceId || "")
      .send();
  }

  /**
   * Send accepted response (202)
   */
  static accepted<T>(
    res: Response,
    data?: T,
    options?: {
      message?: string;
      traceId?: string;
    }
  ) {
    return ApiResponseHelper.success(res, data, {
      statusCode: 202,
      message: options?.message || "Request accepted for processing",
      traceId: options?.traceId,
    });
  }

  /**
   * Calculate pagination metadata
   */
  static calculatePagination(
    total: number,
    page: number,
    limit: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Calculate offset from page and limit
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Validate pagination parameters
   */
  static validatePaginationParams(page: number, limit: number) {
    const MIN_PAGE = 1;
    const MAX_LIMIT = 1000;
    const DEFAULT_LIMIT = 20;

    const validPage = Math.max(page, MIN_PAGE);
    const validLimit = Math.min(Math.max(limit || DEFAULT_LIMIT, 1), MAX_LIMIT);

    return { page: validPage, limit: validLimit };
  }
}
