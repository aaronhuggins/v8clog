/** @jsx x */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { createXMLHandler, h, xml } from "../jsx.ts";
import { V8Metadata } from "../../backend/V8Metadata.ts";
import { MilestoneBody, MilestoneInput } from "./Milestone.tsx";

const x = createXMLHandler(h);
const getData = async () => {
  const metadata = new V8Metadata();
  return await metadata.allMilestoneEntries();
};
const data = await getData();
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

export const RSS = xml(function RSS({ origin }: { origin: string }) {
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
          <RSSItem detail={val.detail} data={val.features} apiChanges={val.apiChanges} origin={origin} />
        ))}
      </channel>
    </rss>
  );
}, { atomLink: "atom:link" });

function RSSItem(
  { detail, data, apiChanges, origin }: MilestoneInput & { origin: string },
) {
  if (detail.stable_date === null) return null;
  return (
    <item>
      <title>V8 release v{detail.mstone}</title>
      <link>{origin}/clog/{detail.mstone}</link>
      <guid>{origin}/clog/{detail.mstone}</guid>
      <pubDate>{getPubDate(new Date(detail.stable_date))}</pubDate>
      {data.hasFeatures
        ? data.tags.map((tag) => <category>{tag}</category>)
        : <category>No New Features</category>}
      <description>
        <MilestoneBody data={data} apiChanges={apiChanges} style={false} />
      </description>
    </item>
  );
}
