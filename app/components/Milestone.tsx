/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import type { FeatureDetail } from "../../lib/chromestatus/FeatureDetails.ts";
import type { FeatureData } from "../../lib/FeatureData.ts";
import type { MilestonePair } from "../../lib/V8Metadata.ts"
import { h } from "../jsx.ts"

interface MilestoneInput {
  detail: MilestonePair['detail']
  data: FeatureData
}

export function Milestone ({ detail, data }: MilestoneInput) {
  return (
    <div>
      <div class="uk-card uk-card-body uk-card-default uk-background-secondary uk-light">
        <div class="uk-card-header">
          <h3 class="">V8 release v{ detail.mstone }</h3>
          <p class="uk-text-meta uk-margin-remove-top">
            Stable date: <time datetime={detail.stable_date}>{ new Date(detail.stable_date).toDateString() }</time>
          </p>
        </div>
        { data.hasFeatures ? null : (<div class="uk-card-body"><p>No new features in this version.</p></div>) }
        <MilestoneBody category="Enabled by default" featureDetails={data.enabled} />
        <MilestoneBody category="Deprecated" featureDetails={data.deprecated} />
        <MilestoneBody category="Removed" featureDetails={data.removed} />
        <MilestoneBody category="Browser Intervention" featureDetails={data.browserIntervention} />
        <MilestoneBody category="Origin trial" featureDetails={data.originTrial} />
        <MilestoneBody category="In developer trial behind flag" featureDetails={data.developerTrial} />
        <div class="uk-card-footer"></div>
      </div>
      <hr></hr>
    </div>
  )
}

function MilestoneBody (props: { category: string; featureDetails: FeatureDetail[] }) {
  const { category, featureDetails } = props

  if (featureDetails.length === 0) return null

  return (
    <div class="uk-card-body uk-background-secondary uk-light">
      <h4>{ category } { featureDetails.length === 0 ? '(None)' : `(${featureDetails.length})`}</h4>
      {
        featureDetails.map(val => (
          <div class="uk-section uk-padding-small uk-padding-remove-top">
            <h5>{ val.name }</h5>
            <p class="uk-text-meta uk-margin-remove-top formatted">
              Category: { val.category }{val.flag_name && val.flag_name.startsWith('--') ? `\nFlag name: ${val.flag_name}` : ''}
            </p>
            <p class="uk-light formatted">{ val.summary }</p>
            <details>
              <summary>JSON data</summary>
              <pre><code class="json">{JSON.stringify(val, null, 2)}</code></pre>
            </details>
          </div>
        ))
      }
    </div>
  )
}
