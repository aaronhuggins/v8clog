/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"
import { V8Metadata } from "../../lib/V8Metadata.ts"

const getData = async () => {
  const metadata = new V8Metadata()
  const latest = await metadata.channelDetails()
  return await metadata.allDetailsInRange({ start: "8.0", end: latest.canary.mstone })
}
const data = await getData()

export function RSS () {
  return (
    <rss version="2.0">
      <channel>
          <title>Test</title>
          <link>test</link>
          <description>test</description>
          <item>
            <title>test</title>
            <link>test</link>
            <guid>test</guid>
            <pubDate>Tues, 23 Aug 2016 10:00:00 CDT</pubDate>
            <description>test</description>
          </item>
      </channel>
    </rss>
  )
}
