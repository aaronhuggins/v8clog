/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { h, renderSSR, Helmet } from "./app/jsx.ts"
import { Header } from "./app/components/Header.tsx"
import { Home } from "./app/components/Home.tsx"
import { RSS } from "./app/components/RSS.tsx"
import { StaticFile } from "./app/StaticFile.ts"

const App = () => {
  return (
    <div>
      <Helmet>
        <html lang="en" amp />

        <body class="root" />
        <body class="main" id="id" />

        <title>V8 Clog: The Blog-style Changelog for the JavaScript Engine</title>
        <meta name="description" content="V8 Clog" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:creator" content="@aaronhugginsdev" />
        <meta name="twitter:image" content="https://v8clog.deno.dev/static/v8clog.png"></meta>
        <meta property="og:url" content="https://v8clog.deno.dev" />
        <meta property="og:title" content="V8 Clog" />
        <meta property="og:description" content="The (Unofficial) Blog-style Changelog for the V8 JavaScript Engine." />
        <meta property="og:image" content="https://v8clog.deno.dev/static/v8clog.png" />
      </Helmet>

      <Header />
      <Home />
    </div>
  )
}

serve(function server (request) {
  const url = new URL(request.url)
  const file = new StaticFile(request.url)

  if (file.isStatic) return file.response()

  switch (file.path) {
    case "./rss.xml": {
      const rss = '<?xml version="1.0" encoding="utf-8"?>\n' + renderSSR(<RSS />)
      return new Response(rss, {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "no-cache, no-store"
        }
      })
    }
    case "./": {
      const app = renderSSR(<App />)
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
    default: {
      return Response.redirect(url.origin, 307)
    }
  }
})
