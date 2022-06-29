/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"

export function Header () {
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
            <li class="uk-active">
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/clog">Clog</a>
            </li>
            <li>
              <a href="https://v8.dev/">v8.dev</a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
