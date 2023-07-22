import { WebApiCache } from "./backend/Cache.ts";
import { Router } from "./frontend/Router.tsx";

const router = new Router();
const cache = Deno.env.get("CACHE_TYPE") === "deno_builtin"
  ? await caches.open("app")
  : new WebApiCache();

Deno.serve(router.respond(cache));
