/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h, Helmet } from "../jsx.ts";

export function Meta({ name, origin, path }: MetaInput) {
  const site = "V8 Clog";
  return (
    <Helmet>
      <title>{name} - {site}</title>
      <meta name="description" content={name} />
      <link rel="canonical" href={`${origin}${path}`} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content="@aaronhugginsdev" />
      <meta name="twitter:image" content={`${origin}/static/v8clog.png`}></meta>
      <meta property="og:url" content={`${origin}${path}`} />
      <meta property="og:title" content={`${name} - ${site}`} />
      <meta property="og:description" content={name} />
      <meta property="og:image" content={`${origin}/static/v8clog.png`} />
    </Helmet>
  );
}

interface MetaInput {
  name: string;
  origin: string;
  path: string;
}
