import { WebApiCache } from "./backend/Cache.ts";
import { CACHE_TYPE, MIGRATE_DATA, V8 } from "./backend/constants.ts";
import {
  DenoKvCollection,
  JSONCollection,
  JSONDB,
} from "./backend/jsondb/JSONDB.ts";
import { Router } from "./frontend/Router.tsx";

const router = new Router();
const cache = CACHE_TYPE ? await caches.open("app") : new WebApiCache();

if (MIGRATE_DATA) {
  const oldDb = new JSONDB({ prefix: "data/" }, JSONCollection);
  const newDb = new JSONDB({ prefix: "data/kv/" }, DenoKvCollection);
  for (const name of Object.values(V8)) {
    await newDb.get(name).import(oldDb.get(name));
  }
}

Deno.serve(router.respond(cache));
