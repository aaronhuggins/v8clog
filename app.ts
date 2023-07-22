import { WebApiCache } from "./backend/Cache.ts";
import { CACHE_TYPE } from "./backend/constants.ts";
import { Router } from "./frontend/Router.tsx";

const router = new Router();
const cache = CACHE_TYPE ? await caches.open("app") : new WebApiCache();

Deno.serve(router.respond(cache));
