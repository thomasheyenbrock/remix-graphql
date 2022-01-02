import { ExecutionResult } from "graphql";

export function deriveStatusCode(
  _executionResult: ExecutionResult,
  defaultStatusCode: number
): number {
  return defaultStatusCode;
}

export type DeriveStatusCodeFunction = typeof deriveStatusCode;
