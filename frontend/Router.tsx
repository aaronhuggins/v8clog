// deno-lint-ignore-file no-explicit-any
/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

declare global {
  interface URLSearchParams extends Map<string, string> {
    size: number;
  }
}

import { RSS } from "../frontend/components/RSS.tsx";
import { createXMLRenderer, h, Helmet, renderSSR } from "../frontend/jsx.ts";
import { App } from "../frontend/components/App.tsx";
import { Home } from "../frontend/components/Home.tsx";
import { Clog } from "./components/Clog.tsx";
import { ClogEntry } from "./components/ClogEntry.tsx";
import { StaticFile } from "../backend/StaticFile.ts";
import { About } from "./components/About.tsx";
import { V8ChangeLog } from "../backend/v8/V8ChangeLog.ts";
import { V8Release } from "../backend/v8/V8Release.ts";
import { Milestone } from "./components/Milestone.tsx";
import { BACKEND_TYPE } from "../backend/constants.ts";

const renderXML = createXMLRenderer(renderSSR);

export class Router {
  #staticCache = new Map<string, StaticFile>();
  routes = new Map<RouteName, URLPattern | boolean>([
    ["/", true],
    ["/clog", new URLPattern({ pathname: "/clog/:version" })],
    ["/rss.xml", true],
    ["/static", true],
    ["/about", true],
    ["/robots.txt", true],
  ]);

  #isRouteName(name: any): name is RouteName {
    return Array.from(this.routes.keys()).includes(name);
  }

  #getRoute(urlString: string) {
    const url = new URL(urlString);
    const [_, second] = url.pathname.split("/");
    const name = "/" + second;
    const isRoute = this.#isRouteName(name);
    const result = isRoute ? this.routes.get(name) : undefined;
    const route: Route = {
      name: isRoute ? name : null,
      url,
      params: {},
    };

    if (result && result !== true) {
      const match = result.exec(url);

      if (match) route.params = match.pathname.groups;
    }

    if (url.searchParams.size > 0) {
      route.params = {
        ...route.params,
        ...Object.fromEntries(url.searchParams.entries()),
      };
    }

    return route;
  }

  respond() {
    return async (request: Request) => {
      const route = this.#getRoute(request.url);
      const v8clog = new V8ChangeLog(BACKEND_TYPE);

      switch (route.name) {
        case "/": {
          const latest = await v8clog.getLatest();
          const releases = await v8clog.getRange(
            latest.milestone - 1,
            latest.milestone + 2,
          );
          return this.#renderHTML(
            <App active="home">
              <Home origin={route.url.origin}>
                {await Promise.all(
                  releases.reverse().map(async (val, index) => {
                    return (
                      <Milestone
                        release={val}
                        features={await val.getFeatures()}
                        sep={index !== releases.length - 1}
                      />
                    );
                  }),
                )}
              </Home>
            </App>,
          );
        }
        case "/about": {
          return this.#renderHTML(
            <App active="about">
              <About origin={route.url.origin} />
            </App>,
          );
        }
        case "/clog": {
          if (route.params.version) {
            try {
              const release = await v8clog.getRelease(route.params.version);
              const features = await release.getFeatures();
              const changes = await release.getChanges();

              return this.#renderHTML(
                <App active="none">
                  <ClogEntry
                    release={release}
                    features={features}
                    changes={changes}
                    origin={route.url.origin}
                    v8clog={v8clog}
                  />
                </App>,
              );
            } catch (_error) {
              /* Missing or broken entries should redirect home. */
            }
          } else {
            const limit = +(route.params.limit ?? "20");
            let data: V8Release[] = [];
            if (route.params.start) {
              data = await v8clog.getRange(
                +(route.params.start ?? "0"),
                +(route.params.end ?? "0"),
              );
            } else if (route.params.milestone) {
              const milestone = +(route.params.milestone ?? "0");
              data = await v8clog.getRange(
                milestone - limit,
                milestone,
              );
            } else {
              const latest = await v8clog.getLatest();
              data = [
                latest,
                ...(await v8clog.getRange(
                  latest.milestone - limit,
                  latest.milestone - 1,
                )),
              ];
            }
            return this.#renderHTML(
              <App active="clog">
                <Clog
                  origin={route.url.origin}
                  data={data}
                  milestone={data[0].milestone}
                  limit={limit}
                  v8clog={v8clog}
                />
              </App>,
            );
          }
          break;
        }
        case "/robots.txt": {
          return new Response("", {
            headers: {
              "Content-Type": "text/plain",
            },
          });
        }
        case "/rss.xml": {
          const latest = await v8clog.getLatest();
          const data = await Promise.all(
            (await v8clog.getRange(v8clog.earliest, latest.milestone)).map(
              async (release) => {
                const [features, changes] = await Promise.all([
                  release.getFeatures(),
                  release.getChanges(),
                ]);
                return {
                  release,
                  features,
                  changes,
                };
              },
            ),
          );
          return this.#renderRSS(<RSS origin={route.url.origin} data={data} />);
        }
        case "/static": {
          const file = this.#staticCache.get(route.url.href) ??
            new StaticFile(route.url);
          this.#staticCache.set(route.url.href, file);
          if (file.isStatic) return file.response();
          break;
        }
      }

      return Response.redirect(route.url.origin, 307);
    };
  }

  #renderHTML(input: any) {
    const app = renderSSR(input);
    const { body, head, footer, attributes } = Helmet.SSR(app);

    const html = `
    <!DOCTYPE html>
    <html ${attributes.html.toString()}>
      <head>
        ${head.join("\n")}
      </head>
      <body ${attributes.body.toString()}>
        ${body}
        ${footer.join("\n")}
      </body>
    </html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }

  #renderRSS(input: any) {
    const xmlDirective = '<?xml version="1.0" encoding="utf-8"?>';
    const rss = xmlDirective + renderXML(input);
    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml",
        "Cache-Control": "no-cache, no-store",
      },
    });
  }
}

type RouteName =
  | "/"
  | "/clog"
  | "/static"
  | "/rss.xml"
  | "/about"
  | "/robots.txt";

interface Route<T extends Record<string, any> = Record<string, any>> {
  name: RouteName | null;
  url: URL;
  params: T;
}
