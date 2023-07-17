import { Router } from "./frontend/Router.tsx";

const router = new Router();

Deno.serve(router.respond());
