import { Prisma } from "@prisma/client";
import type { Joke, User } from "@prisma/client";
import { t } from "./type-factory";
import { UserType } from "./user";

export const JokeType = t.objectType<Joke & { jokster: User }>({
  name: "Joke",
  fields: () => [
    t.field({ name: "id", type: t.NonNull(t.ID) }),
    t.field({ name: "name", type: t.NonNull(t.String) }),
    t.field({ name: "content", type: t.NonNull(t.String) }),
    t.field({ name: "jokster", type: t.NonNull(UserType) }),
  ],
});

export enum OrderJokesBy {
  createdAt,
}

export const OrderJokesByEnum = t.enumType({
  name: "OrderJokesBy",
  values: [{ name: "createdAt", value: OrderJokesBy.createdAt }],
});

export const OrderDirectionEnum = t.enumType({
  name: "OrderDirection",
  values: [
    { name: "asc", value: Prisma.SortOrder.asc },
    { name: "desc", value: Prisma.SortOrder.desc },
  ],
});

type CreateJokeFieldErrors = { name?: string; content?: string };

export const CreateJokeFieldErrorsType = t.objectType<CreateJokeFieldErrors>({
  name: "CreateJokeFieldErrors",
  fields: () => [
    t.field({
      name: "name",
      type: t.String,
      resolve({ name }) {
        return name;
      },
    }),
    t.field({
      name: "content",
      type: t.String,
      resolve({ content }) {
        return content;
      },
    }),
  ],
});

type CreateJokeFields = { name: string; content: string };

export const CreateJokeFieldsType = t.objectType<CreateJokeFields>({
  name: "CreateJokeFields",
  fields: () => [
    t.field({ name: "name", type: t.NonNull(t.String) }),
    t.field({ name: "content", type: t.NonNull(t.String) }),
  ],
});

type CreateJokeResult = {
  fieldErrors?: CreateJokeFieldErrors;
  fields?: CreateJokeFields;
  joke?: Joke & { jokster: User };
};

export const CreateJokeResultType = t.objectType<CreateJokeResult>({
  name: "CreateJokeResult",
  fields: () => [
    t.field({
      name: "fieldErrors",
      type: CreateJokeFieldErrorsType,
      resolve({ fieldErrors }) {
        return fieldErrors;
      },
    }),
    t.field({
      name: "fields",
      type: CreateJokeFieldsType,
      resolve({ fields }) {
        return fields;
      },
    }),
    t.field({
      name: "joke",
      type: JokeType,
      resolve({ joke }) {
        return joke;
      },
    }),
  ],
});

export enum Method {
  delete = "delete",
}

export const MethodEnum = t.enumType({
  name: "Method",
  values: [{ name: "delete", value: Method.delete }],
});
