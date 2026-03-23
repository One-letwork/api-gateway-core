"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterHelper = void 0;
class FilterHelper {
    static parseFilterString(filterString) {
        if (!filterString)
            return [];
        const conditions = [];
        filterString.split(";").forEach((condition) => {
            const [field, operator, value] = condition.split(":");
            if (field && operator && value) {
                conditions.push({
                    field: field.trim(),
                    operator: operator.trim(),
                    value: FilterHelper.coerceValue(value),
                });
            }
        });
        return conditions;
    }
    static parseFilterObject(filterObj) {
        if (!filterObj)
            return [];
        const conditions = [];
        Object.entries(filterObj).forEach(([field, value]) => {
            if (value === undefined || value === null)
                return;
            if (typeof value === "string" && value.includes(":")) {
                const [operator, actualValue] = value.split(":");
                if (operator && actualValue) {
                    conditions.push({
                        field,
                        operator: operator,
                        value: FilterHelper.coerceValue(actualValue),
                    });
                    return;
                }
            }
            if (typeof value === "string") {
                const match = value.match(/^([><!]=?|!=|eq|ne|in|contains)(.*)$/);
                if (match) {
                    const operatorMap = {
                        "=": "eq",
                        "==": "eq",
                        "!=": "ne",
                        "<>": "ne",
                        ">": "gt",
                        ">=": "gte",
                        "<": "lt",
                        "<=": "lte",
                    };
                    const operator = operatorMap[match[1]] || match[1];
                    conditions.push({
                        field,
                        operator,
                        value: FilterHelper.coerceValue(match[2]),
                    });
                    return;
                }
            }
            conditions.push({
                field,
                operator: "eq",
                value,
            });
        });
        return conditions;
    }
    static toSqlWhere(conditions) {
        if (conditions.length === 0) {
            return { sql: "", params: [] };
        }
        const params = [];
        const clauses = conditions.map((condition) => {
            const paramIndex = params.length + 1;
            switch (condition.operator) {
                case "eq":
                    params.push(condition.value);
                    return `${condition.field} = $${paramIndex}`;
                case "ne":
                    params.push(condition.value);
                    return `${condition.field} != $${paramIndex}`;
                case "gt":
                    params.push(condition.value);
                    return `${condition.field} > $${paramIndex}`;
                case "gte":
                    params.push(condition.value);
                    return `${condition.field} >= $${paramIndex}`;
                case "lt":
                    params.push(condition.value);
                    return `${condition.field} < $${paramIndex}`;
                case "lte":
                    params.push(condition.value);
                    return `${condition.field} <= $${paramIndex}`;
                case "in":
                    if (Array.isArray(condition.value)) {
                        const placeholders = condition.value.map(() => `$${params.length + 1}`);
                        params.push(...condition.value);
                        return `${condition.field} IN (${placeholders.join(",")})`;
                    }
                    params.push(condition.value);
                    return `${condition.field} = $${paramIndex}`;
                case "nin":
                    if (Array.isArray(condition.value)) {
                        const placeholders = condition.value.map(() => `$${params.length + 1}`);
                        params.push(...condition.value);
                        return `${condition.field} NOT IN (${placeholders.join(",")})`;
                    }
                    params.push(condition.value);
                    return `${condition.field} != $${paramIndex}`;
                case "contains":
                    params.push(`%${condition.value}%`);
                    return `${condition.field} LIKE $${paramIndex}`;
                case "regex":
                    params.push(condition.value);
                    return `${condition.field} ~* $${paramIndex}`;
                default:
                    params.push(condition.value);
                    return `${condition.field} = $${paramIndex}`;
            }
        });
        return {
            sql: clauses.join(" AND "),
            params,
        };
    }
    static toMongoQuery(conditions) {
        const query = {};
        conditions.forEach((condition) => {
            switch (condition.operator) {
                case "eq":
                    query[condition.field] = condition.value;
                    break;
                case "ne":
                    query[condition.field] = { $ne: condition.value };
                    break;
                case "gt":
                    query[condition.field] = { $gt: condition.value };
                    break;
                case "gte":
                    query[condition.field] = { $gte: condition.value };
                    break;
                case "lt":
                    query[condition.field] = { $lt: condition.value };
                    break;
                case "lte":
                    query[condition.field] = { $lte: condition.value };
                    break;
                case "in":
                    query[condition.field] = { $in: Array.isArray(condition.value) ? condition.value : [condition.value] };
                    break;
                case "nin":
                    query[condition.field] = { $nin: Array.isArray(condition.value) ? condition.value : [condition.value] };
                    break;
                case "contains":
                    query[condition.field] = { $regex: condition.value, $options: "i" };
                    break;
                case "regex":
                    query[condition.field] = { $regex: condition.value };
                    break;
            }
        });
        return query;
    }
    static coerceValue(value) {
        if (value === "true")
            return true;
        if (value === "false")
            return false;
        if (value === "null")
            return null;
        if (value === "undefined")
            return undefined;
        if (!isNaN(Number(value)) && value !== "")
            return Number(value);
        if (value.startsWith("[") && value.endsWith("]")) {
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        return value;
    }
    static sanitizeFieldName(field) {
        return field.replace(/[^a-zA-Z0-9_.]/g, "");
    }
}
exports.FilterHelper = FilterHelper;
//# sourceMappingURL=filtering.js.map