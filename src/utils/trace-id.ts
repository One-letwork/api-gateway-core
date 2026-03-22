/**
 * Trace ID Generation Utility
 */

import { randomBytes } from "crypto";

export function generateTraceId(): string {
  return `${Date.now()}-${randomBytes(8).toString("hex")}`;
}
