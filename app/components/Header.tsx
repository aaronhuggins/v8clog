/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"

export function Header () {
  return (
    <header id="header">
      <nav class="uk-navbar uk-navbar-container" uk-navbar>
        <div class="uk-navbar-left">
          <a href="/" class="uk-link-reset" style={{
            background: "url(/static/v8-outline.svg) no-repeat 50%",
            backgroundSize: "80%",
            height: "6.5em",
            width: "6.5em",
          }}>
            <span style={{ display: "none" }}>V8</span>
            <div style={{
              textAlign: "center",
              marginTop: "2.25em",
              color: "white",
              fontWeight: "bold",
              fontSize: "1.5em",
              textDecoration: "none",
              textStroke: "1px gray",
              "-webkit-text-stroke": "1px gray"
            }}>CLOG</div>
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