import type { ActionFunction, LinksFunction, MetaFunction } from "remix";
import { Form, Link, useActionData, useSearchParams } from "remix";
import { processRequestWithGraphQL } from "remix-graphql/index.server";
import { schema } from "~/graphql/schema";
import type { LoginMutation } from "~/graphql/types";
import stylesUrl from "../styles/login.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const meta: MetaFunction = () => {
  return {
    title: "Remix Jokes | Login",
    description: "Login to submit your own jokes to Remix Jokes!",
  };
};

const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login(
    $loginType: LoginType!
    $username: String!
    $password: String!
    $redirectTo: String
  ) {
    login(
      loginType: $loginType
      username: $username
      password: $password
      redirectTo: $redirectTo
    ) {
      fields {
        loginType
        username
        password
      }
      fieldErrors {
        username
        password
      }
      formError
    }
  }
`;

export const action: ActionFunction = (args) =>
  processRequestWithGraphQL({ args, query: LOGIN_MUTATION, schema });

export default function Login() {
  const actionData = useActionData<{ data?: LoginMutation }>();
  const formError = actionData?.data?.login?.formError;
  const fieldErrors = actionData?.data?.login?.fieldErrors;
  const fields = actionData?.data?.login?.fields;
  const [searchParams] = useSearchParams();
  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <Form
          method="post"
          aria-describedby={formError ? "form-error-message" : undefined}
        >
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? undefined}
          />
          <fieldset>
            <legend className="sr-only">Login or Register?</legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !fields?.loginType || fields.loginType === "login"
                }
              />{" "}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={fields?.loginType === "register"}
              />{" "}
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={fields?.username}
              aria-invalid={Boolean(fieldErrors?.username)}
              aria-describedby={
                fieldErrors?.username ? "username-error" : undefined
              }
            />
            {fieldErrors?.username ? (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {fieldErrors.username}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              type="password"
              defaultValue={fields?.password}
              aria-invalid={Boolean(fieldErrors?.password)}
              aria-describedby={
                fieldErrors?.password ? "password-error" : undefined
              }
            />
            {fieldErrors?.password ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div id="form-error-message">
            {formError ? (
              <p className="form-validation-error" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button">
            Submit
          </button>
        </Form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
