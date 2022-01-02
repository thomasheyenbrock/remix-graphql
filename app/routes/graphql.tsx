import { GraphQLError } from "graphql";
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  shouldRenderGraphiQL,
} from "graphql-helix";
import { json } from "remix";
import { Readable } from "stream";
import { schema } from "~/graphql/schema";

import type { Request as HelixRequest } from "graphql-helix";
import type { ActionFunction, LoaderFunction } from "remix";

function hasStatus(error: any): error is { status: number } {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    typeof error.status === "number"
  );
}

async function handleRequest(request: HelixRequest) {
  // Determine whether we should render GraphiQL instead of returning an API response
  if (shouldRenderGraphiQL(request)) {
    return new Response(renderGraphiQL(), {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Extract the Graphql parameters from the request
  const { operationName, query, variables } = getGraphQLParameters(request);

  // Validate and execute the query
  const result = await processRequest({
    operationName,
    query,
    variables,
    request,
    schema,
  });

  if (result.type !== "RESPONSE") {
    return new Response("GraphQL operation is not supported", {
      status: 400,
    });
  }

  const status = result.payload.errors
    ? result.payload.errors.reduce(
        (maxStatus, error) =>
          hasStatus(error.extensions)
            ? Math.max(maxStatus, error.extensions.status)
            : maxStatus,
        result.status
      )
    : result.status;
  return json(result.payload, { status });
}

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

export const loader: LoaderFunction = ({ request }) => {
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
    body: null,
    headers: request.headers,
    method: request.method,
    query,
  });
};

async function parseBody(
  request: Request
): Promise<
  { type: "success"; json: string } | { type: "error"; message: string }
> {
  const { body } = request;
  const isReadable = body instanceof Readable;
  if (!isReadable) {
    return { type: "error", message: "Request body is not readable" };
  }

  const contentType = request.headers.get("Content-Type") || "";
  const isJSON = /^application\/(graphql\+)?json/.test(contentType);
  if (!isJSON) {
    return { type: "error", message: "Request body does not contain JSON" };
  }

  return new Promise((resolve) => {
    let text = "";
    body.on("data", (chunk) => {
      text += chunk;
    });
    body.on("error", (error) => {
      resolve({ type: "error", message: error.message });
    });
    body.on("end", () => {
      try {
        const json = JSON.parse(text);
        resolve({ type: "success", json });
      } catch {
        resolve({
          type: "error",
          message: "Request body contains invalid JSON",
        });
      }
    });
  });
}

export const action: ActionFunction = async ({ request }) => {
  const parseResult = await parseBody(request);
  switch (parseResult.type) {
    case "error":
      return json(
        { errors: [new GraphQLError(parseResult.message)] },
        { status: 400 }
      );
    case "success":
      return handleRequest({
        body: parseResult.json,
        headers: request.headers,
        method: request.method,
        query: new URL(request.url).searchParams,
      });
  }
};
