import { LoaderFunction } from "remix";
import { Link, useLoaderData } from "remix";
import { processRequestWithGraphQL } from "remix-graphql/index.server";
import { schema } from "~/graphql/schema";
import { RandomJokeQuery } from "~/graphql/types";

const RANDOM_JOKE_QUERY = /* GraphQL */ `
  query RandomJoke {
    randomJoke {
      id
      name
      content
    }
  }
`;

export const loader: LoaderFunction = (args) =>
  processRequestWithGraphQL({ args, schema, query: RANDOM_JOKE_QUERY });

export default function JokesIndexRoute() {
  const loaderData = useLoaderData<{ data?: RandomJokeQuery }>();
  const randomJoke = loaderData.data?.randomJoke;

  if (!randomJoke) {
    return (
      <div className="error-container">There are no jokes to display.</div>
    );
  }

  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{randomJoke.content}</p>
      <Link to={randomJoke.id}>"{randomJoke.name}" Permalink</Link>
    </div>
  );
}

export function ErrorBoundary() {
  return <div className="error-container">I did a whoopsies.</div>;
}
