import {
  DeriveStatusCodeFunction,
  getActionFunction,
  getLoaderFunction,
} from "remix-graphql";
import { schema } from "~/graphql/schema";

function hasStatus(error: any): error is { status: number } {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    typeof error.status === "number"
  );
}

const deriveStatusCode: DeriveStatusCodeFunction = (result, defaultStatus) =>
  result.errors
    ? result.errors.reduce(
        (maxStatus, error) =>
          hasStatus(error.extensions)
            ? Math.max(maxStatus, error.extensions.status)
            : maxStatus,
        defaultStatus
      )
    : defaultStatus;

export const loader = getLoaderFunction({ schema, deriveStatusCode });

export const action = getActionFunction({ schema, deriveStatusCode });
