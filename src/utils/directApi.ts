import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { AppRouter } from "~/server/api/root";
import { getBaseUrl } from "./api";
import superjson from "superjson";

const directApi = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
export default directApi;
