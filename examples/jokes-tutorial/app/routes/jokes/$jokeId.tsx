import { GraphQLError } from "graphql";
import type { ActionFunction, LoaderFunction, MetaFunction } from "remix";
import { useActionData, useLoaderData, useParams } from "remix";
import { processRequestWithGraphQL } from "remix-graphql/index.server";
import { JokeDisplay } from "~/components/joke";
import { schema } from "~/graphql/schema";
import type { DeleteJokeMutation, JokeQuery } from "~/graphql/types";
import { ErrorCode } from "~/utils/error-codes";

export const meta: MetaFunction = ({
  data,
}: {
  data: { data?: JokeQuery } | undefined;
}) => {
  if (!data?.data?.joke?.name) {
    return { title: "No joke", description: "No joke found" };
  }
  return {
    title: `"${data.data.joke.name}" joke`,
    description: `Enjoy the "${data.data.joke.name}" joke and much more`,
  };
};

const JOKE_QUERY = /* GraphQL */ `
  query Joke($jokeId: ID!) {
    me {
      id
    }
    joke(id: $jokeId) {
      name
      content
      jokster {
        id
      }
    }
  }
`;

export const loader: LoaderFunction = async (args) =>
  processRequestWithGraphQL({ args, schema, query: JOKE_QUERY });

const DELETE_JOKE_MUTATION = /* GraphQL */ `
  mutation DeleteJoke($_method: Method!, $jokeId: ID!) {
    editJoke(method: $_method, id: $jokeId) {
      id
    }
  }
`;

export const action: ActionFunction = async (args) =>
  processRequestWithGraphQL({ args, schema, query: DELETE_JOKE_MUTATION });

export default function JokeRoute() {
  const loaderData = useLoaderData<{ data?: JokeQuery }>();
  const actionData =
    useActionData<{ data?: DeleteJokeMutation; errors?: GraphQLError[] }>();
  const params = useParams();

  const isUnauthorized = actionData?.errors?.some(
    (error) => error.extensions.code === ErrorCode.UNAUTHORIZED
  );
  if (isUnauthorized) {
    return (
      <div className="error-container">
        Sorry, but {params.jokeId} is not your joke.
      </div>
    );
  }

  const isNotFound = actionData?.errors?.some(
    (error) => error.extensions.code === ErrorCode.NOT_FOUND
  );
  if (isNotFound) {
    return (
      <div className="error-container">
        Huh? What the heck is "{params.jokeId}"?
      </div>
    );
  }

  const isUnknownError = actionData && !actionData.data?.editJoke;
  if (isUnknownError) {
    throw new Error(
      `Unhandled error, mutation returned no data: ${JSON.stringify(
        actionData
      )}`
    );
  }

  const joke = loaderData.data?.joke;
  if (!joke) {
    return (
      <div className="error-container">
        Huh? What the heck is "{params.jokeId}"?
      </div>
    );
  }

  return (
    <JokeDisplay
      joke={joke}
      isOwner={joke.jokster.id === loaderData.data?.me?.id}
    />
  );
}

export function ErrorBoundary() {
  const { jokeId } = useParams();
  return (
    <div className="error-container">
      There was an error loading joke by the id {jokeId}. Sorry.
    </div>
  );
}
