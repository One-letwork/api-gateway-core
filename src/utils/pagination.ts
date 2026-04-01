/**
 * Pagination Utilities
 * Provides pagination support for list endpoints
 */

import { PaginationParams } from "../types";

export interface PaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  minLimit?: number;
  maxLimit?: number;
}

export class PaginationHelper {
  private static defaults: Required<PaginationOptions> = {
    defaultPage: 1,
    defaultLimit: 20,
    minLimit: 1,
    maxLimit: 1000,
  };

  /**
   * Parse pagination parameters from request
   */
  static parse(params: PaginationParams, options?: PaginationOptions): Required<PaginationParams> {
    const opts = { ...PaginationHelper.defaults, ...options };

    let page = params.page || params.offset ? Math.floor((params.offset || 0) / (params.limit || opts.defaultLimit)) + 1 : opts.defaultPage;
    let limit = params.limit || opts.defaultLimit;

    // Validate and constrain values
    page = Math.max(page, 1);
    limit = Math.min(Math.max(limit, opts.minLimit), opts.maxLimit);

    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      offset,
      sortBy: params.sortBy || "",
      sortOrder: params.sortOrder || "asc",
    };
  }

  /**
   * Get pagination metadata
   */
  static getMeta(total: number, page: number, limit: number) {
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
   * Validate sort parameters
   */
  static validateSort(sortBy?: string, allowedFields?: string[]): { sortBy: string; sortOrder: "asc" | "desc" } {
    const defaultSort = { sortBy: "id", sortOrder: "asc" as const };

    if (!sortBy) return defaultSort;

    // Handle format like "field:desc" or "field:asc"
    const [field, order] = sortBy.split(":");
    const sortOrder = (order === "desc" ? "desc" : "asc") as "asc" | "desc";

    // Check if field is in allowed list
    if (allowedFields && !allowedFields.includes(field)) {
      return defaultSort;
    }

    return { sortBy: field, sortOrder };
  }

  /**
   * Create limit and offset for database query
   */
  static toLimitOffset(page: number, limit: number) {
    return {
      offset: (page - 1) * limit,
      limit,
    };
  }

  /**
   * Build SQL pagination string (for database queries)
   */
  static toSqlPagination(page: number, limit: number, sortBy?: string, sortOrder?: string): string {
    const offset = (page - 1) * limit;
    let sql = `LIMIT ${limit} OFFSET ${offset}`;

    if (sortBy) {
      sql = `ORDER BY ${sortBy} ${sortOrder === "desc" ? "DESC" : "ASC"} ${sql}`;
    }

    return sql;
  }
}
