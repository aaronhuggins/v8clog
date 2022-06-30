import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { Router } from "./frontend/Router.tsx"

const router = new Router()

serve(router.respond())
