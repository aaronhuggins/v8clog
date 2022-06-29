/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"

export function Footer ({ active }: { active: 'home' | 'clog' | 'none' }) {
  return (
    <footer id="footer" class="uk-background-secondary" uk-navbar>
      <nav class="uk-navbar-center">
        <ul class="uk-navbar-nav">
          <li class={active === 'home' ? "uk-active" : ""}>
            <a href="/">Home</a>
          </li>
          <li class={active === 'clog' ? "uk-active" : ""}>
            <a href="/clog">Clog Post Archive</a>
          </li>
          <li>
            <a href="https://v8.dev/">The Official v8.dev</a>
          </li>
        </ul>
      </nav>
    </footer>
  )
}
