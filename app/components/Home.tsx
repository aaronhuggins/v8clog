/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"
import { V8Metadata } from "../../lib/V8Metadata.ts"
import { Milestone } from "./Milestone.tsx"
import { FeatureData } from "../../lib/FeatureData.ts";

const getData = async () => {
  const metadata = new V8Metadata()
  const latest = await metadata.channelDetails()
  return await metadata.allDetailsInRange({ start: latest.stable.mstone, end: latest.canary.mstone })
}
const data = await getData()

export function Home () {
  return (
    <div class="uk-section uk-background-secondary">
      <div class="uk-container">
        { data.map((val) => {
          const data = new FeatureData(val.features)
          return (
            <Milestone detail={val.detail} data={data} />
          )
        }) }
      </div>
    </div>
  )
}
