export const IS_DENO_DEPLOY = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
export const BACKEND_TYPE =
  Deno.env.get("BACKEND_TYPE") as "deno_kv" | "json" | undefined ?? "json";
export const CACHE_TYPE =
  Deno.env.get("CACHE_TYPE") as "deno_builtin" | "memory" ?? "memory";
export const MIGRATE_DATA =
  Deno.env.get("MIGRATE_DATA")?.toLowerCase() === "true";
export const V8 = {
  CHANGES: "v8_changes",
  FEATURES: "v8_features",
  RELEASES: "v8_releases",
  TAGS: "v8_tags",
} as const;
