/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"
import { FeatureData } from "../../lib/FeatureData.ts";
import type { MilestonePair } from "../../lib/V8Metadata.ts";
import { Milestone } from "./Milestone.tsx";

export function ClogEntry ({ detail, features }: MilestonePair) {
  const data = new FeatureData(features)
  return (
    <div class="uk-section uk-background-secondary">
      <div class="uk-container">
        <Milestone detail={detail} data={data} />
      </div>
    </div>
  )
}
