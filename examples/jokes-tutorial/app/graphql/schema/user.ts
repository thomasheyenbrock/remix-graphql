import type { User } from "@prisma/client";
import { t } from "./type-factory";

export const UserType = t.objectType<User>({
  name: "User",
  description: "A User",
  fields: () => [
    t.field({ name: "id", type: t.NonNull(t.ID) }),
    t.field({ name: "username", type: t.NonNull(t.String) }),
  ],
});

export enum LoginType {
  login = "login",
  register = "register",
}

export const LoginTypeType = t.enumType({
  name: "LoginType",
  values: [
    { name: "login", value: LoginType.login },
    { name: "register", value: LoginType.register },
  ],
});

type LoginFieldErrors = { username?: string; password?: string };

export const LoginFieldErrorsType = t.objectType<LoginFieldErrors>({
  name: "LoginFieldErrors",
  fields: () => [
    t.field({
      name: "username",
      type: t.String,
      resolve({ username }) {
        return username;
      },
    }),
    t.field({
      name: "password",
      type: t.String,
      resolve({ password }) {
        return password;
      },
    }),
  ],
});

type LoginFields = { loginType: string; username: string; password: string };

export const LoginFieldsType = t.objectType<LoginFields>({
  name: "LoginFields",
  fields: () => [
    t.field({ name: "loginType", type: t.NonNull(t.String) }),
    t.field({ name: "username", type: t.NonNull(t.String) }),
    t.field({ name: "password", type: t.NonNull(t.String) }),
  ],
});

export const LoginResultType = t.objectType<{
  formError?: string;
  fieldErrors?: LoginFieldErrors;
  fields?: LoginFieldErrors;
}>({
  name: "LoginResult",
  fields: () => [
    t.field({
      name: "formError",
      type: t.String,
      resolve({ formError }) {
        return formError;
      },
    }),
    t.field({
      name: "fieldErrors",
      type: LoginFieldErrorsType,
      resolve({ fieldErrors }) {
        return fieldErrors;
      },
    }),
    t.field({
      name: "fields",
      type: LoginFieldsType,
      resolve({ fields }) {
        return fields || null;
      },
    }),
  ],
});
