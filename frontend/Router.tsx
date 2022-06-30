// deno-lint-ignore-file no-explicit-any
/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { RSS } from "../frontend/components/RSS.tsx";
import { h, Helmet, renderSSR } from "../frontend/jsx.ts";
import { App } from "../frontend/components/App.tsx"
import { Home } from "../frontend/components/Home.tsx";
import { Clog } from "./components/Clog.tsx";
import { V8Metadata } from "../backend/V8Metadata.ts";
import { ClogEntry } from "./components/ClogEntry.tsx";
import { StaticFile } from "../backend/StaticFile.ts";

export class Router {
  routes = new Map<RouteName, URLPattern | boolean>([
    ['/', true],
    ['/clog', new URLPattern({ pathname: "/clog/:version" })],
    ['/rss.xml', true],
    ['/static', true]
  ])

  #isRouteName (name: any): name is RouteName {
    return Array.from(this.routes.keys()).includes(name)
  }

  #getRoute (urlString: string) {
    const url = new URL(urlString)
    const [_, second] = url.pathname.split("/")
    const name = '/' + second
    const isRoute = this.#isRouteName(name)
    const result = isRoute ? this.routes.get(name) : undefined
    const route: Route = {
      name: isRoute ? name : null,
      url,
      params: {}
    }

    if (result && result !== true) {
      const match = result.exec(url)

      if (match) route.params = match.pathname.groups
    }

    return route
  }

  respond () {
    return async (request: Request) => {
      const route = this.#getRoute(request.url)

      switch (route.name) {
        case "/": {
          return this.#renderHTML(<App active="home"><Home /></App>)
        }
        case "/clog": {
          if (route.params.version) {
            try {
              const metadata = new V8Metadata()
              const detail = await metadata.milestone(route.params.version)
              const features = await metadata.features(route.params.version)
  
              return this.#renderHTML(<App active="none"><ClogEntry detail={detail} features={features} /></App>)
            } catch (_error) { /* Missing or broken entries should rediect home. */ }
          } else {
            return this.#renderHTML(<App active="clog"><Clog /></App>)
          }
          break
        }
        case "/rss.xml": {
          return this.#renderRSS()
        }
        case "/static": {
          const file = new StaticFile(route.url)
          if (file.isStatic) return file.response()
          break
        }
      }
  
      return Response.redirect(route.url.origin, 307)
    }
  }

  #renderHTML (input: any) {
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

  #renderRSS () {
    const rss = RSS()
    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml",
        "Cache-Control": "no-cache, no-store"
      }
    })
  }
}

type RouteName = "/" | "/clog" | "/static" | "/rss.xml"

interface Route<T extends Record<string, any> = Record<string, any>> {
  name: RouteName | null
  url: URL
  params: T
}
