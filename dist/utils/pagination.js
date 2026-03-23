"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationHelper = void 0;
class PaginationHelper {
    static parse(params, options) {
        const opts = { ...PaginationHelper.defaults, ...options };
        let page = params.page || params.offset ? Math.floor((params.offset || 0) / (params.limit || opts.defaultLimit)) + 1 : opts.defaultPage;
        let limit = params.limit || opts.defaultLimit;
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
    static getMeta(total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        return {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
        };
    }
    static validateSort(sortBy, allowedFields) {
        const defaultSort = { sortBy: "id", sortOrder: "asc" };
        if (!sortBy)
            return defaultSort;
        const [field, order] = sortBy.split(":");
        const sortOrder = (order === "desc" ? "desc" : "asc");
        if (allowedFields && !allowedFields.includes(field)) {
            return defaultSort;
        }
        return { sortBy: field, sortOrder };
    }
    static toLimitOffset(page, limit) {
        return {
            offset: (page - 1) * limit,
            limit,
        };
    }
    static toSqlPagination(page, limit, sortBy, sortOrder) {
        const offset = (page - 1) * limit;
        let sql = `LIMIT ${limit} OFFSET ${offset}`;
        if (sortBy) {
            sql = `ORDER BY ${sortBy} ${sortOrder === "desc" ? "DESC" : "ASC"} ${sql}`;
        }
        return sql;
    }
}
exports.PaginationHelper = PaginationHelper;
PaginationHelper.defaults = {
    defaultPage: 1,
    defaultLimit: 20,
    minLimit: 1,
    maxLimit: 1000,
};
//# sourceMappingURL=pagination.js.map