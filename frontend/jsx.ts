// deno-lint-ignore-file no-explicit-any

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [element: string]: any;
    }
  }
}

export { h, renderSSR, Helmet, Component, Suspense } from "https://deno.land/x/nano_jsx@v0.0.32/mod.ts";
