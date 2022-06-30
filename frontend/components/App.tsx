// deno-lint-ignore-file no-explicit-any
/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h, Helmet } from "../jsx.ts"
import { Footer } from "./Footer.tsx";
import { Header } from "./Header.tsx";

export function App ({ active, children }: { active: ActiveNav; children?: any }) {
  return (
    <div>
      <Helmet>
        <html lang="en" amp />
        <body class="root" />
        <body class="main uk-background-secondary" id="main" />
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uikit@3.14.3/dist/css/uikit.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.5.1/build/styles/a11y-dark.min.css" />
        <link rel="stylesheet" href="/static/extensions.css" />
        <script src="https://cdn.jsdelivr.net/npm/uikit@3.14.3/dist/js/uikit.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/uikit@3.14.3/dist/js/uikit-icons.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.5.1/build/highlight.min.js"></script>
        <script>hljs.highlightAll();</script>
      </Helmet>

      <Header active={active} />
      <div class="uk-section uk-background-secondary">
        { children }
      </div>
      <Footer active={active} />
    </div>
  )
}

export type ActiveNav = 'home' | 'about' | 'clog' | 'none'