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
import { Release } from "./components/Release.tsx";
import { BACKEND_TYPE } from "../backend/constants.ts";
import { Sitemap } from "./components/Sitemap.tsx";
import { URLPatternPlus } from "../backend/URLPatternPlus.ts";

const renderXML = createXMLRenderer(renderSSR);

export class Router {
  #staticCache = new Map<string, StaticFile>();
  routes = new Map<RouteName, URLPatternPlus | boolean>([
    ["/", true],
    [
      "/clog",
      new URLPatternPlus({
        pathname: "/clog/:version?",
        search: "milestone=:milestone?&limit=:limit?",
      }),
    ],
    ["/tag", new URLPatternPlus({ pathname: "/tag/:tagname{/:feed}?" })],
    ["/rss.xml", true],
    ["/sitemap.xml", true],
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

      if (match) {
        const entries = Object.entries(match.pathname.groups ?? {});
        for (const [key, value] of entries) {
          route.params[key] = value ? decodeURIComponent(value) : value;
        }
        const searchEntries = Object.entries(match.search.groups ?? {});
        for (const [key, value] of searchEntries) {
          route.params[key] = Array.isArray(value)
            ? value.map((item) => decodeURIComponent(item))
            : typeof value === "string"
            ? decodeURIComponent(value)
            : value;
        }
      }
    }

    return route;
  }

  respond() {
    const v8clog = new V8ChangeLog(BACKEND_TYPE);
    return async (request: Request) => {
      const route = this.#getRoute(request.url);

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
                    await val.getFeatures();
                    await val.getTags(true);
                    return (
                      <Release
                        release={val}
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
        case "/tag": {
          const releases = await v8clog.getByTag(route.params.tagname);
          await Promise.all(releases.map(async (release) => {
            await release.getFeatures();
            await release.getChanges();
          }));
          if (route.params.feed === "rss.xml") {
            return this.#renderRss(
              <RSS
                origin={route.url.origin}
                releases={releases}
                tag={route.params.tagname}
              />,
            );
          }
          const canonicalPath = `/tag/${
            encodeURIComponent(route.params.tagname)
          }`;
          return this.#renderHTML(
            <App active="clog">
              <Clog
                origin={route.url.origin}
                releases={releases}
                tag={route.params.tagname}
                limit={releases.length}
                v8clog={v8clog}
                canonicalPath={canonicalPath}
              />
            </App>,
          );
        }
        case "/clog": {
          if (route.params.version) {
            try {
              const release = await v8clog.getRelease(route.params.version);
              await release.getFeatures();
              await release.getChanges();
              await release.getTags();

              return this.#renderHTML(
                <App active="none">
                  <ClogEntry
                    release={release}
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
            let canonicalPath = "/clog";
            let releases: V8Release[] = [];
            if (route.params.milestone) {
              const milestone = +(route.params.milestone ?? "0");
              canonicalPath =
                `${canonicalPath}?milestone=${milestone}&limit=${limit}`;
              releases = await v8clog.getRange(
                milestone - limit,
                milestone,
              );
            } else {
              const latest = await v8clog.getLatest();
              releases = [
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
                  releases={releases}
                  milestone={releases[0]?.milestone}
                  limit={limit}
                  v8clog={v8clog}
                  canonicalPath={canonicalPath}
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
          await v8clog.getLatest();
          const releases = await v8clog.getAllData(
            v8clog.earliest,
            v8clog.latest,
          );
          return this.#renderRss(
            <RSS origin={route.url.origin} releases={releases} />,
          );
        }
        case "/sitemap.xml": {
          await v8clog.getLatest();
          const tags = await v8clog.getTags();
          return this.#renderXml(
            <Sitemap
              latest={v8clog.latest}
              origin={route.url.origin}
              tags={tags.map((tag) => tag.name)}
            />,
          );
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

  #renderRss(input: any) {
    return this.#renderXml(input, "application/rss+xml");
  }

  #renderXml(
    input: any,
    contentType = "application/xml",
    cache = "no-cache, no-store",
  ) {
    const xmlDirective = '<?xml version="1.0" encoding="utf-8"?>';
    const xml = xmlDirective + renderXML(input);
    return new Response(xml, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cache,
      },
    });
  }
}

type RouteName =
  | "/"
  | "/clog"
  | "/static"
  | "/tag"
  | "/rss.xml"
  | "/sitemap.xml"
  | "/about"
  | "/robots.txt";

interface Route<T extends Record<string, any> = Record<string, any>> {
  name: RouteName | null;
  url: URL;
  params: T;
}
