import { Prisma } from "@prisma/client";
import { createTypesFactory, buildGraphQLSchema } from "gqtx";

import type { Joke, User } from "@prisma/client";
import { db } from "~/utils/db.server";

const t = createTypesFactory();

const UserType = t.objectType<User>({
  name: "User",
  description: "A User",
  fields: () => [
    t.field({ name: "id", type: t.NonNull(t.ID) }),
    t.field({ name: "username", type: t.NonNull(t.String) }),
  ],
});

const JokeType = t.objectType<Joke & { jokster: User }>({
  name: "Joke",
  fields: () => [
    t.field({ name: "id", type: t.NonNull(t.ID) }),
    t.field({ name: "name", type: t.NonNull(t.String) }),
    t.field({ name: "content", type: t.NonNull(t.String) }),
    t.field({ name: "jokster", type: t.NonNull(UserType) }),
  ],
});

enum OrderJokesBy {
  createdAt,
}

const OrderJokesByEnum = t.enumType({
  name: "OrderJokesBy",
  values: [{ name: "createdAt", value: OrderJokesBy.createdAt }],
});

const OrderDirectionEnum = t.enumType({
  name: "OrderDirection",
  values: [
    { name: "asc", value: Prisma.SortOrder.asc },
    { name: "desc", value: Prisma.SortOrder.desc },
  ],
});

const Query = t.queryType({
  fields: () => [
    t.field({
      name: "jokes",
      type: t.List(JokeType),
      args: {
        take: t.arg(t.Int),
        skip: t.arg(t.Int),
        orderBy: t.arg(OrderJokesByEnum),
        orderDirection: t.arg(OrderDirectionEnum),
      },
      async resolve(_root, args) {
        return db.joke.findMany({
          include: { jokster: true },
          take: args.take ?? undefined,
          skip: args.skip ?? undefined,
          orderBy:
            args.orderBy && args.orderDirection
              ? { [args.orderBy]: args.orderDirection }
              : undefined,
        });
      },
    }),
  ],
});

export const schema = buildGraphQLSchema({
  query: Query,
});
