import { GraphQLError, GraphQLSchema } from "graphql";
import { ActionFunction, json } from "remix";
import { Readable } from "stream";
import { CustomContext } from "./context";
import { deriveStatusCode as defaultDeriveStatusCode } from "./derive-status-code";
import { handleRequest } from "./handle-request";

async function parseBody(
  request: Request
): Promise<
  { type: "success"; json: unknown } | { type: "error"; message: string }
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

export function getActionFunction({
  schema,
  context,
  deriveStatusCode,
}: {
  schema: GraphQLSchema;
  context?: CustomContext;
  deriveStatusCode?: typeof defaultDeriveStatusCode;
}): ActionFunction {
  return async ({ request }) => {
    const parseResult = await parseBody(request);
    switch (parseResult.type) {
      case "error":
        return json(
          { errors: [new GraphQLError(parseResult.message)] },
          { status: 400 }
        );
      case "success":
        return handleRequest({
          remixRequest: request,
          request: {
            body: parseResult.json,
            headers: request.headers,
            method: request.method,
            query: new URL(request.url).searchParams,
          },
          schema,
          context,
          deriveStatusCode,
        });
    }
  };
}
