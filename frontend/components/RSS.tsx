/** @jsx x */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { createXMLHandler, h, xml } from "../jsx.ts";
import { MilestoneBody, MilestoneInput } from "./Release.tsx";
import { ReleaseData } from "../../backend/v8/V8ChangeLog.ts";

const x = createXMLHandler(h);
const getPubDate = (date: Date) => {
  const pieces = date.toString().split(" ");
  const offsetTime = pieces[5].match(/[-+]\d{4}/);
  const offset = (offsetTime) ? offsetTime : pieces[5];
  const parts = [
    pieces[0] + ",",
    pieces[2],
    pieces[1],
    pieces[3],
    pieces[4],
    offset,
  ];

  return parts.join(" ");
};

export const RSS = xml(
  function RSS({ origin, data }: { origin: string; data: ReleaseData[] }) {
    return (
      <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
        <channel>
          <title>V8 Clog</title>
          <link>{origin}</link>
          <description>
            The (Unofficial) Blog-style Changelog for the V8 JavaScript Engine.
          </description>
          <atomLink
            href={`${origin}/rss.xml`}
            rel="self"
            type="application/rss+xml"
          />
          {data.map((val) => (
            <RSSItem
              release={val.release}
              origin={origin}
            />
          ))}
        </channel>
      </rss>
    );
  },
  { atomLink: "atom:link" },
);

function RSSItem(
  { release, origin }: MilestoneInput & { origin: string },
) {
  const features = release.features!;
  return (
    <item>
      <title>V8 release v{release.version}</title>
      <link>{origin}/clog/{release.version}</link>
      <guid>{origin}/clog/{release.version}</guid>
      <pubDate>{getPubDate(new Date(release.stable_date))}</pubDate>
      {features.length > 0
        ? Array.from(
          new Set(features.map((feat) => feat.category)),
          (tag) => <category>{tag}</category>,
        )
        : <category>No New Features</category>}
      <description>
        <MilestoneBody release={release} style={false} />
      </description>
    </item>
  );
}
