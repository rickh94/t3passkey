import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "~/server/api/root";
import { getUrl } from "./shared";

import superjson from "superjson";

const directApi = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: getUrl(),
    }),
  ],
});
export default directApi;
