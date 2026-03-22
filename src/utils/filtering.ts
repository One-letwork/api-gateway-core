/**
 * Filtering Utilities
 * Provides flexible filtering support for list endpoints
 */

import { FilterCondition, FilterOperator, FilterParams } from "../types";

export class FilterHelper {
  /**
   * Parse filter string to conditions
   * Format: "field:operator:value" or "field1:eq:value1;field2:gt:100"
   */
  static parseFilterString(filterString?: string): FilterCondition[] {
    if (!filterString) return [];

    const conditions: FilterCondition[] = [];

    filterString.split(";").forEach((condition) => {
      const [field, operator, value] = condition.split(":");

      if (field && operator && value) {
        conditions.push({
          field: field.trim(),
          operator: operator.trim() as FilterOperator,
          value: FilterHelper.coerceValue(value),
        });
      }
    });

    return conditions;
  }

  /**
   * Parse filter object to conditions
   * Example: { status: "active", age: ">18" }
   */
  static parseFilterObject(filterObj?: Record<string, any>): FilterCondition[] {
    if (!filterObj) return [];

    const conditions: FilterCondition[] = [];

    Object.entries(filterObj).forEach(([field, value]) => {
      if (value === undefined || value === null) return;

      // Handle string with operator: "status:eq:active"
      if (typeof value === "string" && value.includes(":")) {
        const [operator, actualValue] = value.split(":");
        if (operator && actualValue) {
          conditions.push({
            field,
            operator: operator as FilterOperator,
            value: FilterHelper.coerceValue(actualValue),
          });
          return;
        }
      }

      // Handle operators in query like ">100", ">=50", "!=inactive"
      if (typeof value === "string") {
        const match = value.match(/^([><!]=?|!=|eq|ne|in|contains)(.*)$/);
        if (match) {
          const operatorMap: Record<string, FilterOperator> = {
            "=": "eq",
            "==": "eq",
            "!=": "ne",
            "<>": "ne",
            ">": "gt",
            ">=": "gte",
            "<": "lt",
            "<=": "lte",
          };
          const operator = operatorMap[match[1]] || (match[1] as FilterOperator);
          conditions.push({
            field,
            operator,
            value: FilterHelper.coerceValue(match[2]),
          });
          return;
        }
      }

      // Default to equality
      conditions.push({
        field,
        operator: "eq",
        value,
      });
    });

    return conditions;
  }

  /**
   * Convert filter conditions to database WHERE clause
   * Works with common SQL dialects
   */
  static toSqlWhere(conditions: FilterCondition[]): { sql: string; params: any[] } {
    if (conditions.length === 0) {
      return { sql: "", params: [] };
    }

    const params: any[] = [];
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

  /**
   * Convert filter conditions to MongoDB query
   */
  static toMongoQuery(conditions: FilterCondition[]): Record<string, any> {
    const query: Record<string, any> = {};

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

  /**
   * Type coercion for filter values
   */
  private static coerceValue(value: string): any {
    // Boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // Null/undefined
    if (value === "null") return null;
    if (value === "undefined") return undefined;

    // Number
    if (!isNaN(Number(value)) && value !== "") return Number(value);

    // Array
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    // String
    return value;
  }

  /**
   * Sanitize filter to prevent injection
   */
  static sanitizeFieldName(field: string): string {
    // Allow alphanumeric, underscore, and dot notation
    return field.replace(/[^a-zA-Z0-9_.]/g, "");
  }
}
