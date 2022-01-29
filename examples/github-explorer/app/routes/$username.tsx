import type { GraphQLError } from "graphql";
import { Outlet, useLoaderData, useParams } from "remix";
import type { LoaderFunction } from "remix";
import { sendGraphQLRequest } from "remix-graphql/index.server";
import type { ArrayItem } from "~/graphql/helpers";
import { endpoint } from "~/graphql/endpoint.server";
import { LoadUserQuery } from "~/graphql/types";

const LOAD_USER_QUERY = /* GraphQL */ `
  query LoadUser($username: String!) {
    user(login: $username) {
      login
      name
      repositories(
        privacy: PUBLIC
        isFork: false
        first: 10
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          id
          name
          stargazerCount
        }
      }
    }
  }
`;

export const loader: LoaderFunction = (args) =>
  sendGraphQLRequest({
    args,
    endpoint,
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    query: LOAD_USER_QUERY,
  });

type User = NonNullable<LoadUserQuery["user"]>;
type Repo = NonNullable<ArrayItem<NonNullable<User["repositories"]>["nodes"]>>;

export default function () {
  const params = useParams();
  const loaderData = useLoaderData<{
    data?: LoadUserQuery;
    errors?: GraphQLError[];
    message?: string;
  }>();
  const user = loaderData.data?.user;
  if (!user) {
    return (
      <h2>
        {loaderData.errors?.[0].message ||
          loaderData.message ||
          `Cannot find a user with the username ${params.username}`}
      </h2>
    );
  }
  const repos = user.repositories.nodes?.filter((node): node is Repo => !!node);
  return (
    <main>
      <h2>Public repositories of {user.name || user.login}</h2>
      {repos && repos.length > 0 ? (
        <ul>
          {repos.map((repo) => (
            <li key={repo.id}>
              {repo.name} ({repo.stargazerCount} stars)
            </li>
          ))}
        </ul>
      ) : (
        <p>No repositories found</p>
      )}
      <Outlet />
    </main>
  );
}
