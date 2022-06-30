/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"
import { V8Metadata } from "../../backend/V8Metadata.ts"
import { Milestone } from "./Milestone.tsx"
import { FeatureData } from "../../backend/FeatureData.ts";

const getData = async () => {
  const metadata = new V8Metadata()
  const latest = await metadata.channelDetails()
  return await metadata.allDetailsInRange({ start: latest.stable.mstone, end: latest.canary.mstone })
}
const data = await getData()

export function Home () {
  return (
    <div class="uk-container">
      <p class="lead uk-text-primary uk-text-large uk-text-center">The (Unofficial) Blog-style Changelog for the V8 JavaScript Engine</p>
      { data.map((val) => {
        const data = new FeatureData(val.features)
        return (
          <Milestone detail={val.detail} data={data} />
        )
      }) }
    </div>
  )
}
