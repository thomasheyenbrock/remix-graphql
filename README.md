# remix-graphql

[Remix](https://remix.run) and [GraphQL](https://graphql.org) can live together
in harmony ❤️ This package contains basic utility functions that can help you
with that.

To be more speciic, here's what the latest version of `remix-graphql` can help
you with:

- Handling loader and action requests using GraphQL queries and mutations
- Setting up a GraphQL API as a [resource route](https://remix.run/docs/en/v1/guides/resource-routes)

And here are some cool ideas what it might do as well in the future:

- Executing operations against a resource route in the same project or
  against a remote GraphQL API
- Batching queries from multiple loaders into a single API request

## Contents

- [Installing](#installing)
- [Defining your schema](#defining-your-schema)
- [Installing](#installing)
- [Handle loader and action requests with GraphQL](#handle-loader-and-action-requests-with-graphql)
  - [Automated type generation](#automated-type-generation)
- [Set up a GraphQL API in a Remix app](#set-up-a-graphql-api-in-a-remix-app)
- [Context](#context)
  - [`request`](#request)
  - [`redirect`](#redirect)

## Installing

You can install `remix-graphql` with your preferred package manager. It depends
on the `graphql` package, so make sure to also have that installed.

```sh
# Using `npm`
npm install graphql remix-graphql
# Or using `yarn`
yarn add graphql remix-graphql
```

It also lists some of the Remix-packages as peer dependencies. (If you used the
Remix CLI to setup your project, you most likely have them installed already.)
If you get unexpected errors, double check that the following are installed:

- `@remix-run/dev`
- `@remix-run/react`
- `@remix-run/serve`
- `remix`

## Defining your schema

`remix-graphql` keeps it simple and let's you decide on the best way to define
your GraphQL schema. In all places where you need to "pass your schema to
`remix-graphql`", the respective function expects a `GraphQLSchema` object.

That means all of the following approached work to define a schema:

- Using the `GraphQLSchema` class from the `graphql` package (obviously...)
- Defining the schema using the SDL, defining resolver functions in an object
  and merging both with `makeExecutableSchema` (from `@graphql-tools/schema`)
- Using `nexus` and `makeSchema`

We recommend exporting the schema from a file, e.g. `app/graphql/schema.server.ts`.
By using the `.server.ts` extension you make sure that none of this code will
end up being shipped to the browser. (This is a hint to the Remix compiler that
it should ignore this module when building the browser bundle.)

## Handle loader and action requests with GraphQL

Both `loaders` and `actions` are just simple functions that return a `Response`
given a `Request`. With `remix-graphql` you can use GraphQL to process this
request! Here's a complete and working example of how it works:

```tsx
// app/routes/index.tsx
import { Form } from "remix";
import type { ActionFunction, LoaderFunction } from "remix";
import { processRequestWithGraphQL } from "remix-graphql/index.server";

// Import your schema from whereever you export it
import { schema } from "~/graphql/schema";

const ALL_POSTS_QUERY = /* GraphQL */ `
  query Posts($limit: Int) {
    posts(limit: $limit) {
      id
      title
      likes
      author {
        name
      }
    }
  }
`;

export const loader: LoaderFunction = (args) =>
  processRequestWithGraphQL({
    // Pass on the arguments that Remix passes to a loader function.
    args,
    // Provide your schema.
    schema,
    // Provide a GraphQL operation that should be executed. This can also be a
    // mutation, it is named `query` to align with the common naming when
    // sending GraphQL requests over HTTP.
    query: ALL_POSTS_QUERY,
    // Optionally provide variables that should be used for executing the
    // operation. If this is not passed, `remix-graphql` will derive variables
    // from...
    // - ...the route params.
    // - ...the submitted `formData` (if it exists).
    variables: { limit: 10 },
    // Optionally pass an object with properties that should be included in the
    // execution context.
    context: {},
    // Optionally pass a function to derive a custom HTTP status code for a
    // successfully executed operation.
    deriveStatusCode(
      // The result of the execution.
      executionResult: ExecutionResult,
      // The status code that would be returned by default, i.e. of the
      // `deriveStatusCode` function is not passed.
      defaultStatusCode: number
    ) {
      return defaultStatusCode;
    },
  });

const LIKE_POST_MUTATION = /* GraphQL */ `
  mutation LikePost($id: ID!) {
    likePost(id: $id) {
      id
      likes
    }
  }
`;

// The `processRequestWithGraphQL` function can be used for both loaders and
// actions!
export const action: ActionFunction = (args) =>
  processRequestWithGraphQL({ args, schema, query: LIKE_POST_MUTATION });

export default function IndexRoute() {
  const { data } = useLoaderData();
  if (!data) {
    return "Ooops, something went wrong :(";
  }

  return (
    <main>
      <h1>Blog Posts</h1>
      <ul>
        {data.posts.map((post) => (
          <li key={post.id}>
            {post.title} (by {post.author.name})
            <br />
            {post.likes} Likes
            <Form method="post">
              {/* `remix-graphql` will automatically transform all posted 
                  form data into variables of the same name for the GraphQL
                  operation */}
              <input hidden name="id" value={post.id} />
              <button type="submit">Like</button>
            </Form>
          </li>
        ))}
      </ul>
    </main>
  );
}

type LoaderData = {
  data?: {
    posts: {
      id: string;
      title: string;
      likes: number;
      author: { name: string };
    }[];
  };
};
```

### Automated type generation

Hidden at the end of the example above you see that the data returned from the
loader function had to be typed by hand. Since GraphQL is strongly typed, you
can automate this if you want to!

First, you need to generate the introspection data as JSON from your schema and
store it in a local file. For that you can create a simple script like this:

```ts
// app/graphql/introspection.{js,ts}
import fs from "fs";
import { introspectionFromSchema } from "graphql";
import path from "path";
import { schema } from "./schema";

fs.writeFileSync(
  path.join(__dirname, "introspection.json"),
  JSON.stringify(introspectionFromSchema(schema))
);
```

Usually you don't want to commit the generated JSON file to version control, so
we recommend to add it to your `.gitignore` file.

To make running this script easier, create a simple NPM script for it in your
`package.json`:

```json
{
  "scripts": {
    // If you created the script with JavaScript
    "introspection": "node app/graphql/introspection.js",
    // If you created the script with TypeScript (make sure to install
    // `esbuild-register` as dev-dependency in this case)
    "introspection": "node --require esbuild-register app/graphql/introspection.ts"
  }
}
```

To actually generate types from your queries and mutations we recommend using
[GraphQL Code Generator](https://www.graphql-code-generator.com). For that you
need to install a couple of dependencies:

```sh
# Using `npm`
npm install --save-dev @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations
# Or using `yarn`
yarn add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations
```

Almost there! Now create a config file named `codegen.yml` in the root of your
project that contains the following:

```yml
overwrite: true
# The path where the previously generated introspection data is stored
schema: "app/graphql/introspection.json"
# A glob that matches all files that contain operation definitions
documents: "app/routes/**/*.{ts,tsx}"
generates:
  # This is the path where the generated types will be stored
  app/graphql/types.ts:
    plugins:
      - "typescript"
      - "typescript-operations"
    config:
      skipTypename: true
```

Now you can finally generate the types! For convenience, add another NPM
script:

```json
{
  "scripts": {
    "introspection": "node --require esbuild-register app/graphql/introspection.ts",
    "codegen": "npm run introspection && graphql-codegen --config codegen.yml"
  }
}
```

Running `npm run codegen` (or `yarn codegen`) will now automatically create
types for the returned data for all queries and mutations. (Side-note: It's
also a great way to validate if all your operations are valid against your
schema!)

**One more thing:** Noticed the `/* GraphQL */` comment we included before the
strings that contain queries and mutations in the example above? This is
important! It's a hint to `@graphql-codegen` that this string should be
parsed as GraphQL. Without it you won't get any types for the operation
defined within the string.

The example above could now be modified like this:

```ts
// Add this import...
import type { PostsQuery } from "~/graphql/types";

// ...and change the `LoaderData` type like this:
type LoaderData = { data?: PostsQuery };
```

## Set up a GraphQL API in a Remix app

You can create a dedicated endpoint for your GraphQL API using resource routes
in Remix. All you need to do is create a route (e.g. `app/routes/graphql.ts`)
and paste the following code. By using both a loader and an action your endpoint
supports both GET and POST requests!

```ts
// app/routes/graphql.ts
import {
  createActionFunction,
  createLoaderFunction,
} from "remix-graphql/index.server";
import type { DeriveStatusCodeFunction } from "remix-graphql/index.server";

// Import your schema from whereever you export it
import { schema } from "~/graphql/schema";

// Handles GET requests
export const loader = createLoaderFunction({
  // Provide your schema.
  schema,
  // Optionally pass an object with properties that should be included in the
  // execution context.
  context: {},
  // Optionally pass a function to derive a custom HTTP status code for a
  // successfully executed operation.
  deriveStatusCode,
});

// Handles POST requests
export const action = createActionFunction({
  // Provide your schema.
  schema,
  // Optionally pass an object with properties that should be included in the
  // execution context.
  context: {},
  // Optionally pass a function to derive a custom HTTP status code for a
  // successfully executed operation.
  deriveStatusCode,
});

// This function equals the default behaviour.
const deriveStatusCode: DeriveStatusCodeFunction = (
  // The result of the execution.
  executionResult,
  // The status code that would be returned by default, i.e. of the
  // `deriveStatusCode` function is not passed.
  defaultStatusCode
) => defaultStatusCode;
```

## Context

When defining a schema and writing resolvers, it's common to provide a context-
object. All functions exported by `remix-graphql` accept an optional property
`context` in the arguments object. When passed, it must be an object. All of
its properties will be included in the context object passed to your resolvers.

`remix-graphql` also exports a `Context` type that contains all properties
that are added to this context objects for execution. This type accepts an
optional generic by which you can add any custom properties to your context
object.

```ts
import type { PrismaClient } from "@prisma/client";
import type { Context } from "remix-graphql/index.server";

type ContextWithDatabase = Context<{ db: PrismaClient }>;
```

The following subsections highlight all properties that are added to the
context object by `remix-graphql`.

### `request`

This is the `Request` object that is passed to a loader- or action-function in
Remix. It will always be part of the context object.

### `redirect`

When handling loaders or actions in UI routes, a common pattern in Remix is
redirection. (Remix even provides a `redirect` utility function that can be
returned from any loader- or action-function.) In `remix-graphql` you can
achieve this by using the `redirect` function that is provided in the context
object.

This function has the following signature:

```ts
function redirect(
  // The URL for redirection
  url: string,
  // Optionally header values to include in the HTTP response
  headers?: HeadersInit
): void;
```

Note that this function is only part of the context object when handling
GraphQL requests in UI routes, i.e. when using `processRequestWithGraphQL`.
It is _NOT_ part of the context object when handling GraphQL requests in a
resource route, i.e. when using `createActionFunction` or `createLoaderFunction`.
