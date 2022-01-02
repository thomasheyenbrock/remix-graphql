import { GraphQLError, GraphQLSchema } from "graphql";
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  Request as HelixRequest,
  shouldRenderGraphiQL,
} from "graphql-helix";
import { json } from "remix";
import { deriveStatusCode as defaultDeriveStatusCode } from "./derive-status-code";

export async function handleRequest({
  request,
  schema,
  deriveStatusCode = defaultDeriveStatusCode,
}: {
  request: HelixRequest;
  schema: GraphQLSchema;
  deriveStatusCode?: typeof defaultDeriveStatusCode;
}) {
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
    return json(
      { errors: [new GraphQLError("GraphQL operation is not supported")] },
      { status: 400 }
    );
  }

  const status = deriveStatusCode(result.payload, result.status);
  return json(result.payload, { status });
}
