import { WebApiCache } from "./backend/Cache.ts";
import { Router } from "./frontend/Router.tsx";

const router = new Router();
const cache = Deno.env.get("CACHE_TYPE") === "deno_builtin"
  ? new WebApiCache()
  : await caches.open("app");

Deno.serve(router.respond(cache));
