# remix-graphql

[Remix](https://remix.run) and [GraphQL](https://graphql.org) can live together
in harmony ❤️ This package contains basic utility functions that can help you
with that.

To be more speciic, here's what the latest version of `remix-graphql` can help
you with:

- Setting up a GraphQL API as a [resource route](https://remix.run/docs/en/v1/guides/resource-routes)

And here are some cool ideas what it might do as well in the future:

- Creating loaders and actions based on GraphQL queries and mutations
- Executing these operations against a resource route in the same project or
  against a remote GraphQL API
- Batching queries from multiple loaders into a single API request

## Set up a GraphQL API in a Remix app

First, create your GraphQL schema with your method of choice: Vanilla
`graphql-js`, `nexus`, `gqtx`, everything works as long as it gives you
a `GraphQLSchema` object. Create some module that exports this schema,
for example under `~/graphql/schema.ts`.

Second, install `remix-graphql` and the `graphql` package with your preferred
package manager. It lists some of the Remix-packages as peer dependencies, but
you should already have them installed after setting up a Remix project with
the CLI.

```sh
# Using `npm`
npm install graphql remix-graphql
# Or using `yarn`
yarn add graphql remix-graphql
```

Third (and already last), create a file for your resource route, e.g.
`~/routes/graphql.ts` and with the following few lines of code you got
yourself a working GraphQL API that supports GET and POST requests! 🥳

```ts
import {
  createActionFunction,
  createLoaderFunction,
} from "remix-graphql/index.server";

// Import your schema from whereever you put it
import { schema } from "~/graphql/schema";

// Handles GET requests
export const loader = createLoaderFunction({ schema });

// Handles POST requests
export const action = createActionFunction({ schema });
```

## API

The package exports the following functions and types.

### `createActionFunction`

This higher-order-function returns a loader function that can handle
GraphQL requests via POST.

```tsx
// app/routes/graphql.ts
import { createActionFunction } from "remix-graphql/index.server";
import schema from "~/graphql/schema.ts";

export const action = createActionFunction({ schema });
```

The function accepts a single argument of the following type:

```ts
type Options = {
  // The schema to use for execution (required)
  schema: GraphQLSchema;
  // Compute a custom status code for a successfully executed operation (optional)
  deriveStatusCode: DeriveStatusCodeFunction;
};
```

### `createLoaderFunction`

This higher-order-function returns a loader function that can handle
GraphQL requests via GET.

```tsx
// app/routes/graphql.ts
import { createLoaderFunction } from "remix-graphql/index.server";
import schema from "~/graphql/schema.ts";

export const loader = createLoaderFunction({ schema });
```

The function accepts a single argument of the following type:

```ts
type Options = {
  // The schema to use for execution (required)
  schema: GraphQLSchema;
  // Compute a custom status code for a successfully executed operation (optional)
  deriveStatusCode: DeriveStatusCodeFunction;
};
```

### `DeriveStatusCodeFunction`

This TypeScript type can be used for explicit typing of the `deriveStatusCode`
option that can be passed to `createActionFunction` and `createLoaderFunction`.

```ts
type DeriveStatusCodeFunction = (
  // This type comes from the "graphql" package
  executionResult: ExecutionResult,
  // This is the status code that would be returned by default
  defaultStatusCode: number
) => number;
```
