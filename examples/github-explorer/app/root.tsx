import type { GraphQLError } from "graphql";
import {
  Form,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useActionData,
  useCatch,
} from "remix";
import type { ActionFunction, MetaFunction } from "remix";
import { sendGraphQLRequest } from "remix-graphql/index.server";
import type { ArrayItem } from "~/graphql/helpers";
import { endpoint } from "~/graphql/endpoint.server";
import { SearchUsersQuery } from "~/graphql/types";

export const meta: MetaFunction = () => {
  return { title: "GitHub Explorer" };
};

type ExtractUserType<T> = T extends { __typename: "User" } ? T : never;

const SEARCH_USERS_QUERY = /* GraphQL */ `
  query SearchUsers($searchBy: String!) {
    search(type: USER, query: $searchBy, first: 10) {
      nodes {
        __typename
        ... on User {
          login
          name
        }
      }
    }
  }
`;

export const action: ActionFunction = (args) =>
  sendGraphQLRequest({
    args,
    endpoint,
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    query: SEARCH_USERS_QUERY,
  });

export default function App() {
  const actionData = useActionData<{
    data?: SearchUsersQuery;
    errors?: GraphQLError[];
    message?: string;
  }>();
  const nodes = actionData?.data?.search.nodes?.filter(
    (
      node
    ): node is ExtractUserType<
      ArrayItem<SearchUsersQuery["search"]["nodes"]>
    > => node?.__typename === "User"
  );

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header>
          <h1>GitHub Explorer</h1>
          <h2>Search for a user</h2>
          <Form method="post">
            <label>
              Username: <input name="searchBy" placeholder="johndoe" />
            </label>
            <button>Search</button>
          </Form>
          {actionData ? (
            <>
              <h3>Search results</h3>
              {nodes ? (
                nodes.length === 0 ? (
                  <p>No results found</p>
                ) : (
                  <ul>
                    {nodes.map((node) => (
                      <li key={node.login}>
                        <Link to={node.login}>{node.login}</Link>
                        {node.name ? ` (${node.name})` : ""}
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <>
                  <p>Something went wrong, could not find any results</p>
                  {actionData?.errors?.[0] ? (
                    <p>Details: {actionData?.errors?.[0].message}</p>
                  ) : null}
                  {actionData?.message ? (
                    <p>Details: {actionData.message}</p>
                  ) : null}
                </>
              )}
            </>
          ) : null}
        </header>
        <main>
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  return (
    <main>
      <h1>Something went wrong</h1>
      <Link to="/">Back to homepage</Link>
      <p>Details:</p>
      <pre>{JSON.stringify(caught.data, null, 2)}</pre>
    </main>
  );
}
