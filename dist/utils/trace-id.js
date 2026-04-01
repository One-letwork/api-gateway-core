"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTraceId = generateTraceId;
const crypto_1 = require("crypto");
function generateTraceId() {
    return `${Date.now()}-${(0, crypto_1.randomBytes)(8).toString("hex")}`;
}
//# sourceMappingURL=trace-id.js.map