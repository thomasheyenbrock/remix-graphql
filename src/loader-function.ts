import { GraphQLSchema } from "graphql";
import { LoaderFunction } from "remix";
import { deriveStatusCode as defaultDeriveStatusCode } from "./derive-status-code";
import { handleRequest } from "./handle-request";

type Dict<Value> = {
  constructor: never;
  hasOwnProperty: never;
  isPropertyOf: never;
  propertyIsEnumerable: never;
  toLocaleString: never;
  toString: never;
  valueOf: never;
  [key: string]: Value;
};

export function getLoaderFunction({
  schema,
  deriveStatusCode,
}: {
  schema: GraphQLSchema;
  deriveStatusCode?: typeof defaultDeriveStatusCode;
}): LoaderFunction {
  return ({ request }) => {
    const query: Dict<string | string[]> = Object.create(null);
    for (const [key, value] of new URL(request.url).searchParams.entries()) {
      if (!(key in query)) {
        query[key] = value;
      } else {
        const currentValue = query[key];
        if (Array.isArray(currentValue)) {
          currentValue.push(value);
        } else {
          query[key] = [currentValue, value];
        }
      }
    }
    return handleRequest({
      request: {
        body: null,
        headers: request.headers,
        method: request.method,
        query,
      },
      schema,
      deriveStatusCode,
    });
  };
}
