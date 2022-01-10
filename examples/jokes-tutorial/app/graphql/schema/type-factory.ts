import { createTypesFactory } from "gqtx";
import { Context } from "remix-graphql/index.server";

export const t = createTypesFactory<Context>();
