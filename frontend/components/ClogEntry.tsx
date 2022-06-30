/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"
import { FeatureData } from "../../backend/FeatureData.ts";
import type { MilestonePair } from "../../backend/V8Metadata.ts";
import { Milestone } from "./Milestone.tsx";
import { Meta } from "./Meta.tsx";

export function ClogEntry ({ detail, features, origin }: MilestonePair & { origin: string }) {
  const data = new FeatureData(features)
  return (
    <div class="uk-container">
      <Meta origin={origin} name={`V8 release v${detail.mstone}`} path={`/clog/${detail.mstone}`} />
      <Milestone detail={detail} data={data} />
    </div>
  )
}
