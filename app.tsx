// deno-lint-ignore-file no-explicit-any
/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { h, renderSSR, Helmet } from "./app/jsx.ts"
import { Home } from "./app/components/Home.tsx"
import { RSS } from "./app/components/RSS.tsx"
import { StaticFile } from "./app/StaticFile.ts"
import { V8Metadata } from "./lib/V8Metadata.ts";
import { App } from "./app/components/App.tsx";
import { ClogEntry } from "./app/components/ClogEntry.tsx";
import { Clog } from "./app/components/Clog.tsx";

const pattern = new URLPattern({ pathname: "/clog/:version" })

serve(async function server (request) {
  const url = new URL(request.url)
  const file = new StaticFile(url)

  if (url.pathname.startsWith("/clog/")) {
    const parsed = pattern.exec(request.url)
    const metadata = new V8Metadata()
    try {
      const detail = await metadata.milestone(parsed?.pathname.groups.version ?? '')
      const features = await metadata.features(parsed?.pathname.groups.version ?? '')
  
      return renderHTML(<App><ClogEntry detail={detail} features={features} /></App>)
    } catch (_error) { /* Missing or broken entries should rediect home. */ }
  }

  if (file.isStatic) return file.response()

  switch (file.path) {
    case "./rss.xml": {
      return renderRSS(<RSS />)
    }
    case "./clog": {
      return renderHTML(<App><Clog /></App>)
    }
    case "./": {    
      return renderHTML(<App><Home /></App>)
    }
    default: {
      return Response.redirect(url.origin, 307)
    }
  }
})

function renderRSS (input: any) {
  const rss = '<?xml version="1.0" encoding="utf-8"?>\n' + renderSSR(input)
  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-cache, no-store"
    }
  })
}

function renderHTML (input: any) {
  const app = renderSSR(input)
  const { body, head, footer, attributes } = Helmet.SSR(app)

  const html = `
  <!DOCTYPE html>
  <html ${attributes.html.toString()}>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uikit@3.14.3/dist/css/uikit.min.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.5.1/build/styles/a11y-dark.min.css">
      <link rel="stylesheet" href="/static/extensions.css" />
      <script src="https://cdn.jsdelivr.net/npm/uikit@3.14.3/dist/js/uikit.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/uikit@3.14.3/dist/js/uikit-icons.min.js"></script>
      <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.5.1/build/highlight.min.js"></script>
      <script>hljs.highlightAll();</script>
      ${head.join('\n')}
    </head>
    <body ${attributes.body.toString()}>
      ${body}
      ${footer.join('\n')}
    </body>
  </html>`

  return new Response(html, {
    headers: {
      "Content-Type": "text/html"
    }
  })
}