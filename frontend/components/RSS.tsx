/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h, renderSSR } from "../jsx.ts"
import { V8Metadata } from "../../backend/V8Metadata.ts"
import { MilestoneBody, MilestoneInput } from "./Milestone.tsx";

const getData = async () => {
  const metadata = new V8Metadata()
  const latest = await metadata.channelDetails()
  return await metadata.allDetailsInRange({ start: "8.0", end: latest.canary.mstone })
}
const data = await getData()
const getPubDate = (date: Date) => {
  const pieces     = date.toString().split(' ')
  const offsetTime = pieces[5].match(/[-+]\d{4}/)
  const offset     = (offsetTime) ? offsetTime : pieces[5]
  const parts      = [
        pieces[0] + ',',
        pieces[2],
        pieces[1],
        pieces[3],
        pieces[4],
        offset
      ];

  return parts.join(' ');
}

export function RSS () {
  return (
    `<?xml version="1.0" encoding="utf-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
          <title>V8 Clog</title>
          <link>https://v8clog.deno.dev</link>
          <description>The (Unofficial) Blog-style Changelog for the V8 JavaScript Engine.</description>
          <atom:link href="https://v8clog.deno.dev/rss.xml" rel="self" type="application/rss+xml" />
          ${
            data.map(val => RSSItem({ detail: val.detail, data: val.features })).join('')
          }
      </channel>
    </rss>`
  )
}

function RSSItem ({ detail, data }: MilestoneInput) {
  return (
    `<item>
      <title>V8 release v${ detail.mstone }</title>
      <link>https://v8clog.deno.dev/clog/${detail.mstone}</link>
      <guid>https://v8clog.deno.dev/clog/${detail.mstone}</guid>
      <pubDate>${getPubDate(new Date(detail.stable_date))}</pubDate>
      ${
        data.hasFeatures
          ? data.tags.map(tag => `<category>${tag}</category>`)
          : "<category>No New Features</category>"
      }
      <description>${renderSSR(<MilestoneBody data={data} style={false} />)}</description>
    </item>`
  )
}
