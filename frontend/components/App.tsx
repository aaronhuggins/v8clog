// deno-lint-ignore-file no-explicit-any
/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h, Helmet } from "../jsx.ts";
import { Footer } from "./Footer.tsx";
import { Header } from "./Header.tsx";

export function App(
  { active, children }: { active: ActiveNav; children?: any },
) {
  return (
    <div>
      <Helmet>
        <html lang="en" amp />
        <body class="root" />
        <body class="main uk-background-secondary" id="main" />
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/png" href="/static/v8clog.png"></link>
        <link rel="stylesheet" href="/static/uikit.min.css" />
        <link rel="stylesheet" href="/static/a11y-dark.min.css" />
        <link rel="stylesheet" href="/static/extensions.css" />
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/uikit@3.14.3/dist/js/uikit.min.js"
        >
        </script>
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/uikit@3.14.3/dist/js/uikit-icons.min.js"
        >
        </script>
        <script defer src="/static/highlight.min.js"></script>
        <script>
          {`document.addEventListener('DOMContentLoaded', (event) => {
            document.querySelectorAll('pre code').forEach((el) => {
              hljs.highlightElement(el);
            });
          });`}
        </script>
      </Helmet>

      <Header active={active} />
      <div class="uk-section uk-background-secondary">
        {children}
      </div>
      <Footer active={active} />
    </div>
  );
}

export type ActiveNav = "home" | "about" | "clog" | "none";
