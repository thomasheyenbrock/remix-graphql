export type Context<Custom extends CustomContext = {}> = Custom & {
  request: Request;
  redirect?(url: string, headers?: HeadersInit): void;
};

export type CustomContext = {
  // These two context properties are reserved by `remix-graphql`
  request?: never;
  redirect?: never;
  // Everything else is allowed
  [key: string]: unknown;
};
