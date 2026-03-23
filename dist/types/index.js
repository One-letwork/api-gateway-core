"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiGatewayError = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["BAD_GATEWAY"] = "BAD_GATEWAY";
    ErrorCode["GATEWAY_TIMEOUT"] = "GATEWAY_TIMEOUT";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class ApiGatewayError extends Error {
    constructor(code, statusCode, message, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = "ApiGatewayError";
        Object.setPrototypeOf(this, ApiGatewayError.prototype);
    }
}
exports.ApiGatewayError = ApiGatewayError;
//# sourceMappingURL=index.js.map