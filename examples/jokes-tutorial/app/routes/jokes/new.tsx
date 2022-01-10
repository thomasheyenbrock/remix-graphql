import { GraphQLError } from "graphql";
import type { ActionFunction, LoaderFunction } from "remix";
import { Form, Link, useActionData, useLoaderData, useTransition } from "remix";
import { processRequestWithGraphQL } from "remix-graphql/index.server";
import { JokeDisplay } from "~/components/joke";
import { schema } from "~/graphql/schema";
import { CreateJokeMutation, CreateJokeUserQuery } from "~/graphql/types";

function validateJokeContent(content: string) {
  if (content.length < 10) {
    return "That joke is too short";
  }
}

function validateJokeName(name: string) {
  if (name.length < 3) {
    return "That joke's name is too short";
  }
}

const CREATE_JOKE_MUTATION = /* GraphQL */ `
  mutation CreateJoke($name: String!, $content: String!) {
    createJoke(name: $name, content: $content) {
      fields {
        name
        content
      }
      fieldErrors {
        name
        content
      }
      joke {
        id
      }
    }
  }
`;

export const action: ActionFunction = (args) =>
  processRequestWithGraphQL({ args, schema, query: CREATE_JOKE_MUTATION });

const CREATE_JOKE_QUERY = /* GraphQL */ `
  query CreateJokeUser {
    me {
      username
    }
  }
`;

export const loader: LoaderFunction = (args) =>
  processRequestWithGraphQL({ args, schema, query: CREATE_JOKE_QUERY });
// {
//   const user = await getUser(request);
//   if (!user) {
//     throw new Response("Unauthorized", { status: 401 });
//   }
//   return {};
// }

export default function NewJokeRoute() {
  const laoderData = useLoaderData<{ data?: CreateJokeUserQuery }>();
  const actionData =
    useActionData<{ data?: CreateJokeMutation; errors?: GraphQLError[] }>();
  const transition = useTransition();

  if (transition.submission) {
    const name = transition.submission.formData.get("name");
    const content = transition.submission.formData.get("content");
    if (
      typeof name === "string" &&
      typeof content === "string" &&
      !validateJokeName(name) &&
      !validateJokeContent(name)
    ) {
      return <JokeDisplay joke={{ name, content }} isOwner canDelete={false} />;
    }
  }

  const isUnauthorized =
    !laoderData.data?.me ||
    actionData?.errors?.some(
      (error) => error.extensions.code === "UNAUTHORIZED"
    );
  if (isUnauthorized) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a joke.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }

  const fields = actionData?.data?.createJoke?.fields;
  const fieldErrors = actionData?.data?.createJoke?.fieldErrors;

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form method="post">
        <div>
          <label>
            Name:{" "}
            <input
              type="text"
              defaultValue={fields?.name}
              name="name"
              aria-invalid={Boolean(fieldErrors?.name) || undefined}
              aria-describedby={fieldErrors?.name ? "name-error" : undefined}
            />
          </label>
          {fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{" "}
            <textarea
              name="content"
              defaultValue={fields?.content}
              aria-invalid={Boolean(fieldErrors?.content) || undefined}
              aria-describedby={
                fieldErrors?.content ? "content-error" : undefined
              }
            />
          </label>
          {fieldErrors?.content ? (
            <p
              className="form-validation-error"
              role="alert"
              id="content-error"
            >
              {fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
}
