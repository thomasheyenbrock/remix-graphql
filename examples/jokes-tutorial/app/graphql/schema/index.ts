import { buildGraphQLSchema } from "gqtx";
import { GraphQLError } from "graphql";
import { ErrorCode } from "~/utils/error-codes";
import { db } from "~/utils/db.server";
import {
  createUserSession,
  getUser,
  login,
  logout,
  register,
  requireUserId,
} from "~/utils/session.server";
import {
  validateJokeContent,
  validateJokeName,
  validatePassword,
  validateUsername,
} from "~/utils/validators";
import {
  CreateJokeResultType,
  JokeType,
  Method,
  MethodEnum,
  OrderDirectionEnum,
  OrderJokesByEnum,
} from "./joke";
import { t } from "./type-factory";
import { LoginResultType, LoginType, LoginTypeType, UserType } from "./user";

const Query = t.queryType({
  fields: () => [
    t.field({
      name: "me",
      type: UserType,
      async resolve(_root, _args, ctx) {
        return getUser(ctx.request);
      },
    }),
    t.field({
      name: "jokes",
      type: t.NonNull(t.List(t.NonNull(JokeType))),
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
    t.field({
      name: "joke",
      args: { id: t.arg(t.NonNullInput(t.ID)) },
      type: JokeType,
      resolve(_root, args) {
        return db.joke.findUnique({
          include: { jokster: true },
          where: { id: args.id },
        });
      },
    }),
    t.field({
      name: "randomJoke",
      type: JokeType,
      async resolve() {
        const count = await db.joke.count();
        const randomRowNumber = Math.floor(Math.random() * count);
        const [randomJoke] = await db.joke.findMany({
          include: { jokster: true },
          skip: randomRowNumber,
          take: 1,
        });
        return randomJoke;
      },
    }),
  ],
});

const Mutation = t.mutationType({
  fields: () => [
    t.field({
      name: "login",
      args: {
        loginType: t.arg(t.NonNullInput(LoginTypeType)),
        username: t.arg(t.NonNullInput(t.String)),
        password: t.arg(t.NonNullInput(t.String)),
        redirectTo: t.defaultArg(t.String, "/jokes"),
      },
      type: LoginResultType,
      async resolve(_root, args, ctx) {
        // We always get a value here, but if it's an empty string we want to
        // fall back to the default.
        const redirectTo = args.redirectTo || "/jokes";

        const fieldErrors = {
          username: validateUsername(args.username),
          password: validatePassword(args.password),
        };
        const fields = {
          loginType: args.loginType,
          username: args.username,
          password: args.password,
        };

        if (Object.values(fieldErrors).some(Boolean)) {
          return { fieldErrors, fields };
        }

        switch (args.loginType) {
          case LoginType.login:
            const user = await login({
              username: args.username,
              password: args.password,
            });
            if (!user) {
              return {
                fields,
                formError: "Username/Password combination is incorrect",
              };
            }
            ctx.redirect?.(redirectTo, {
              "Set-Cookie": await createUserSession(user.id),
            });
            return { fields };
          case LoginType.register:
            const userExists = await db.user.findUnique({
              where: { username: args.username },
            });
            if (userExists) {
              return {
                fields,
                formError: `User with username ${args.username} already exists`,
              };
            }
            const newUser = await register({
              username: args.username,
              password: args.password,
            });
            ctx.redirect?.(redirectTo, {
              "Set-Cookie": await createUserSession(newUser.id),
            });
            return { fields };
        }
      },
    }),
    t.field({
      name: "logout",
      type: t.Boolean,
      async resolve(_root, _args, ctx) {
        ctx.redirect?.("/login", { "Set-Cookie": await logout(ctx.request) });
        return true;
      },
    }),
    t.field({
      name: "createJoke",
      args: {
        name: t.arg(t.NonNullInput(t.String)),
        content: t.arg(t.NonNullInput(t.String)),
      },
      type: CreateJokeResultType,
      async resolve(_root, args, ctx) {
        const userId = await requireUserId(ctx);

        const fieldErrors = {
          name: validateJokeName(args.name),
          content: validateJokeContent(args.content),
        };
        const fields = { name: args.name, content: args.content };
        if (Object.values(fieldErrors).some(Boolean)) {
          return { fieldErrors, fields };
        }

        const joke = await db.joke.create({
          data: { ...fields, joksterId: userId },
          include: { jokster: true },
        });
        ctx.redirect?.(`/jokes/${joke.id}`);
        return { joke };
      },
    }),
    t.field({
      name: "editJoke",
      args: {
        method: t.arg(t.NonNullInput(MethodEnum)),
        id: t.arg(t.NonNullInput(t.ID)),
      },
      type: JokeType,
      async resolve(_root, args, ctx) {
        switch (args.method) {
          case Method.delete:
            const userId = await requireUserId(ctx);
            const joke = await db.joke.findUnique({
              include: { jokster: true },
              where: { id: args.id },
            });
            if (!joke) {
              throw new GraphQLError(
                "Can't delete what does not exist",
                undefined, // nodes
                undefined, // source
                undefined, // positions
                undefined, // path
                undefined, // originalError
                { code: ErrorCode.NOT_FOUND, status: 404 }
              );
            }
            if (joke.joksterId !== userId) {
              throw new GraphQLError(
                "Pssh, nice try. That's not your joke",
                undefined, // nodes
                undefined, // source
                undefined, // positions
                undefined, // path
                undefined, // originalError
                { code: ErrorCode.UNAUTHORIZED, status: 401 }
              );
            }
            await db.joke.delete({ where: { id: args.id } });
            ctx.redirect?.("/jokes");
            return joke;
        }
      },
    }),
  ],
});

export const schema = buildGraphQLSchema({ query: Query, mutation: Mutation });
