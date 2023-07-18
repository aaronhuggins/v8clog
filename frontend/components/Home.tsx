/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h, Helmet } from "../jsx.ts";

export function Home(
  // deno-lint-ignore no-explicit-any
  { origin, children }: { origin: string; children?: any[] | any },
) {
  const name = "V8 Clog";
  const description =
    "The (Unofficial) Blog-style Changelog for the V8 JavaScript Engine";
  return (
    <div class="uk-container">
      <Helmet>
        <title>{name}: {description}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={origin} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:creator" content="@aaronhugginsdev" />
        <meta name="twitter:image" content={`${origin}/static/v8clog.png`}>
        </meta>
        <meta property="og:url" content={origin} />
        <meta property="og:title" content={name} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${origin}/static/v8clog.png`} />
      </Helmet>
      <p class="lead uk-text-primary uk-text-large uk-text-center">
        {description}
      </p>
      {children}
      <p class="uk-light uk-text-center">
        <a href="/clog">More releases...</a>
      </p>
    </div>
  );
}
