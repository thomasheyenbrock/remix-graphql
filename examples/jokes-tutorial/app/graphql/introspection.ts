import fs from "fs";
import { introspectionFromSchema } from "graphql";
import path from "path";
import { schema } from "./schema";

fs.writeFileSync(
  path.join(__dirname, "introspection.json"),
  JSON.stringify(introspectionFromSchema(schema))
);
