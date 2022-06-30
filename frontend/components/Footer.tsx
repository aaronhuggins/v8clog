/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"
import type { ActiveNav } from "./App.tsx";

export function Footer ({ active }: { active: ActiveNav }) {
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
          <li class={active === 'about' ? "uk-active" : ""}>
            <a href="/about">About the Clog</a>
          </li>
          <li>
            <a href="https://v8.dev/">The Official v8.dev</a>
          </li>
          <li>
            <a href="/rss.xml"><span class="uk-margin-small-right uk-icon" uk-icon="rss"></span>Subscribe to feed!</a>
          </li>
        </ul>
        <span class="uk-margin-small-right uk-icon uk-light" uk-icon="bolt"></span>
        <p class="uk-light">Made with <a href="https://github.com/aaronhuggins/v8clog">❤️</a> and <a href="https://deno.com/deploy">🦕</a> by <a href="https://twitter.com/AaronHugginsDev">🧔</a></p>
      </nav>
    </footer>
  )
}
