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

## API

The package exports the following functions and types.

### `createActionFunction`

This higher-order-function returns a loader function that can handle
GraphQL requests via POST.

```tsx
// app/routes/graphql.ts
import { createActionFunction } from "remix-graphql";
import schema from "~/graphql/schema.ts";

export const loader = createActionFunction({ schema });
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
import { createLoaderFunction } from "remix-graphql";
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
