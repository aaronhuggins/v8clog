/** @jsx x */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
import { V8Release } from "../../backend/v8/V8Release.ts";
import { createXMLHandler, h, xml } from "../jsx.ts";

const x = createXMLHandler(h);

export const Sitemap = xml(
  function Sitemap(
    { latest, origin, tags }: {
      latest: number;
      origin: string;
      tags: string[];
    },
  ) {
    return (
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <SiteUrl>{`${origin}/`}</SiteUrl>
        <SiteUrl>{`${origin}/clog`}</SiteUrl>
        {Array.from({ length: Math.ceil(latest / 20) - 1 }, (_, i) => {
          const milestone = latest - (20 * (i + 1));
          return (
            <SiteUrl>
              {`${origin}/clog?milestone=${milestone}&limit=20`}
            </SiteUrl>
          );
        })}
        {Array.from({ length: 2 + latest }, (_, i) => {
          const version = V8Release.getVersion(i + 1);
          return <SiteUrl>{`${origin}/clog/${version}`}</SiteUrl>;
        })}
        {tags.sort().map((tagname) => {
          return (
            <SiteUrl>{`${origin}/tag/${encodeURIComponent(tagname)}`}</SiteUrl>
          );
        })}
        <SiteUrl>{`${origin}/about`}</SiteUrl>
      </urlset>
    );
  },
);

function SiteUrl({ children }: { children?: string }) {
  return (
    <url>
      <loc>{children}</loc>
    </url>
  );
}
