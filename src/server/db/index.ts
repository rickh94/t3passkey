import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import { env } from "~/env.mjs";
import * as schema from "./schema";

// const client =
export const db = drizzle(
  createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  }),
  { schema },
);
