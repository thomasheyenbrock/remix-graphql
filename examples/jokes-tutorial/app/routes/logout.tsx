import { ActionFunction, LoaderFunction, redirect } from "remix";
import { processRequestWithGraphQL } from "remix-graphql/index.server";
import { schema } from "~/graphql/schema";

const LOGOUT_MUTATION = /* GraphQL */ `
  mutation Logout {
    logout
  }
`;

export const action: ActionFunction = (args) =>
  processRequestWithGraphQL({ args, query: LOGOUT_MUTATION, schema });

export const loader: LoaderFunction = () => {
  return redirect("/login");
};
