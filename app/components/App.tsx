// deno-lint-ignore-file no-explicit-any
/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h, Helmet } from "../jsx.ts"
import { Footer } from "./Footer.tsx";
import { Header } from "./Header.tsx";

export function App ({ active, children }: { active: 'home' | 'clog' | 'none'; children?: any }) {
  return (
    <div>
      <Helmet>
        <html lang="en" amp />

        <body class="root" />
        <body class="main uk-background-secondary" id="main" />

        <title>V8 Clog: The (Unofficial) Blog-style Changelog for the V8 JavaScript Engine</title>
        <meta name="description" content="The (Unofficial) Blog-style Changelog for the V8 JavaScript Engine" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:creator" content="@aaronhugginsdev" />
        <meta name="twitter:image" content="https://v8clog.deno.dev/static/v8clog.png"></meta>
        <meta property="og:url" content="https://v8clog.deno.dev" />
        <meta property="og:title" content="V8 Clog" />
        <meta property="og:description" content="The (Unofficial) Blog-style Changelog for the V8 JavaScript Engine." />
        <meta property="og:image" content="https://v8clog.deno.dev/static/v8clog.png" />
      </Helmet>

      <Header />
      <div class="uk-section uk-background-secondary">
        { children }
      </div>
      <Footer active={active} />
    </div>
  )
}
