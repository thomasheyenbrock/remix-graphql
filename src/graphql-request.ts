import type { DataFunctionArgs } from "@remix-run/server-runtime";
import { GraphQLError, GraphQLSchema } from "graphql";
import {
  getGraphQLParameters,
  processRequest,
  Request as HelixRequest,
} from "graphql-helix";
import { json } from "remix";
import { Context, CustomContext } from "./context";
import { deriveStatusCode as defaultDeriveStatusCode } from "./derive-status-code";

type Variables = Record<string, unknown>;

async function parseVariables(args: DataFunctionArgs): Promise<Variables> {
  const variables: Record<string, FormDataEntryValue | undefined> = args.params;

  if (args.request.method !== "GET") {
    try {
      const formData = await args.request.formData();
      for (const [key, value] of formData.entries()) {
        variables[key] = value;
      }
    } catch (error) {
      console.warn(`Parsing variables from formData failed: ${error}`);
    }
  }

  return variables;
}

export async function processRequestWithGraphQL({
  args,
  schema,
  query: _query,
  variables: _variables,
  context = {},
  deriveStatusCode = defaultDeriveStatusCode,
}: {
  args: DataFunctionArgs;
  schema: GraphQLSchema;
  query: string;
  variables?: Variables;
  context?: CustomContext;
  deriveStatusCode?: typeof defaultDeriveStatusCode;
}): Promise<Response> {
  const helixRequest: HelixRequest = {
    headers: args.request.headers,
    method: "POST",
    query: {},
    body: {
      query: _query,
      variables: _variables || (await parseVariables(args)),
    },
  };

  // Extract the Graphql parameters from the request
  const { operationName, query, variables } =
    getGraphQLParameters(helixRequest);

  let redirect: string | null = null;
  let headers = new Headers();

  // Validate and execute the query
  const result = await processRequest<Context>({
    operationName,
    query,
    variables,
    request: helixRequest,
    schema,
    contextFactory() {
      return {
        ...context,
        request: args.request,
        redirect(url, headersInit) {
          if (typeof redirect === "string" && url !== redirect) {
            throw new GraphQLError(
              `Tried to perform more than one redirect in one operation (already had ${redirect}, then tried to redirect to ${url})`
            );
          }
          redirect = url;

          // Merge all header values, also for multiple redirects to the same URL
          const addedHeaders = new Headers(headersInit);
          for (const [key, value] of addedHeaders.entries()) {
            headers.append(key, value);
          }
        },
      };
    },
  });

  if (result.type !== "RESPONSE") {
    return json(
      { errors: [new GraphQLError("GraphQL operation is not supported")] },
      { status: 400 }
    );
  }

  let status = deriveStatusCode(result.payload, result.status);

  if (typeof redirect === "string") {
    headers.set("Location", redirect);
    status = 302;
  }

  return json(result.payload, { status, headers });
}
