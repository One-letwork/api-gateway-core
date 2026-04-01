import { FilterCondition } from "../types";
export declare class FilterHelper {
    static parseFilterString(filterString?: string): FilterCondition[];
    static parseFilterObject(filterObj?: Record<string, any>): FilterCondition[];
    static toSqlWhere(conditions: FilterCondition[]): {
        sql: string;
        params: any[];
    };
    static toMongoQuery(conditions: FilterCondition[]): Record<string, any>;
    private static coerceValue;
    static sanitizeFieldName(field: string): string;
}
//# sourceMappingURL=filtering.d.ts.map