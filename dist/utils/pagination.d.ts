import { PaginationParams } from "../types";
export interface PaginationOptions {
    defaultPage?: number;
    defaultLimit?: number;
    minLimit?: number;
    maxLimit?: number;
}
export declare class PaginationHelper {
    private static defaults;
    static parse(params: PaginationParams, options?: PaginationOptions): Required<PaginationParams>;
    static getMeta(total: number, page: number, limit: number): {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
    static validateSort(sortBy?: string, allowedFields?: string[]): {
        sortBy: string;
        sortOrder: "asc" | "desc";
    };
    static toLimitOffset(page: number, limit: number): {
        offset: number;
        limit: number;
    };
    static toSqlPagination(page: number, limit: number, sortBy?: string, sortOrder?: string): string;
}
//# sourceMappingURL=pagination.d.ts.map