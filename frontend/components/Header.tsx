/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts";
import type { ActiveNav } from "./App.tsx";

export function Header({ active }: { active: ActiveNav }) {
  return (
    <header id="header" class="uk-background-primary" uk-navbar>
      <nav class="uk-navbar-center">
        <div class="uk-navbar-left">
          <a href="/" class="uk-link-reset logo">
            <span class="logo">V8</span>
            <div class="logo">CLOG</div>
          </a>
        </div>
        <div class="uk-navbar-right">
          <ul class="uk-navbar-nav">
            <li class={active === "home" ? "uk-active" : ""}>
              <a href="/">Home</a>
            </li>
            <li class={active === "clog" ? "uk-active" : ""}>
              <a href="/clog">Clog</a>
            </li>
            <li>
              <a href="https://v8.dev/">v8.dev</a>
            </li>
            <li>
              <a id="rss" href="/rss.xml">
                <span class="uk-margin-remove-right uk-icon" uk-icon="rss">
                </span>
                <span>RSS</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
