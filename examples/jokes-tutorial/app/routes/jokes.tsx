import type { LinksFunction, LoaderFunction } from "remix";
import { Form, Link, useLoaderData } from "remix";
import { Outlet } from "remix";
import { processRequestWithGraphQL } from "remix-graphql/index.server";
import { schema } from "~/graphql/schema";
import type { JokesQuery } from "~/graphql/types";
import stylesUrl from "../styles/jokes.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

const JOKES_QUERY = /* GraphQL */ `
  query Jokes {
    me {
      username
    }
    jokes(orderBy: createdAt, orderDirection: desc, take: 5) {
      id
      name
    }
  }
`;

export const loader: LoaderFunction = (args) =>
  processRequestWithGraphQL({ args, schema, query: JOKES_QUERY });

export default function JokesRoute() {
  const loaderData = useLoaderData<{ data?: JokesQuery }>();
  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
          {loaderData.data?.me ? (
            <div className="user-info">
              <span>{`Hi ${loaderData.data.me.username}`}</span>
              <Form action="/logout" method="post">
                <button type="submit" className="button">
                  Logout
                </button>
              </Form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            <Link to=".">Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>
            <ul>
              {loaderData.data?.jokes.map((joke) => (
                <li key={joke.id}>
                  <Link to={joke.id} prefetch="intent">
                    {joke.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="new" className="button">
              Add your own
            </Link>
          </div>
          <div className="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
