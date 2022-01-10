export type Context = {
  request: Request;
  redirect?(url: string, headers?: HeadersInit): void;
};
