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