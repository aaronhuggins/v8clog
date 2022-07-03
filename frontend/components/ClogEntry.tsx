/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts";
import type { MilestoneEntry } from "../../backend/V8Metadata.ts";
import { Milestone } from "./Milestone.tsx";
import { Meta } from "./Meta.tsx";

export function ClogEntry(
  { detail, features, origin, apiChanges }: MilestoneEntry & { origin: string },
) {
  return (
    <div class="uk-container">
      <Meta
        origin={origin}
        name={`V8 release v${detail.mstone}`}
        path={`/clog/${detail.mstone}`}
      />
      <Milestone detail={detail} apiChanges={apiChanges} data={features} sep={false} />
    </div>
  );
}
