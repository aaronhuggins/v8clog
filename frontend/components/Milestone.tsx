/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import type { FeatureDetail } from "../../lib/chromestatus/FeatureDetails.ts";
import type { FeatureData } from "../../lib/FeatureData.ts";
import type { MilestonePair } from "../../lib/V8Metadata.ts"
import { h } from "../jsx.ts"

export function Milestone ({ detail, data, style = true }: MilestoneInput) {
  return (
    <div>
      <div class={style ? "uk-card uk-card-body uk-card-default uk-background-secondary uk-light" : ""}>
        <div class={style ? "uk-card-header" : ""}>
          <h3><a href={`/clog/${detail.mstone}`}>V8 release v{ detail.mstone }</a></h3>
          <p class={style ? "uk-text-meta uk-margin-remove-top" : ""}>
            Stable date: <time datetime={detail.stable_date}>{ new Date(detail.stable_date).toDateString() }</time>
          </p>
        </div>
        <MilestoneBody data={data} style={style} />
        <div class={style ? "uk-card-footer" : ""}>
          <p><a href={`/clog/${detail.mstone}`}>Permalink</a></p>
        </div>
      </div>
      <hr></hr>
    </div>
  )
}

export function MilestoneBody ({ data, style = true }: Omit<MilestoneInput, 'detail'>) {
  return (
    <div>
      { data.hasFeatures ? null : (<div class={style ? "uk-card-body" : ""}><p>No new features in this version.</p></div>) }
      <MilestoneCategory category="Enabled by default" featureDetails={data.enabled} style={style} />
      <MilestoneCategory category="Deprecated" featureDetails={data.deprecated} style={style} />
      <MilestoneCategory category="Removed" featureDetails={data.removed} style={style} />
      <MilestoneCategory category="Browser Intervention" featureDetails={data.browserIntervention} style={style} />
      <MilestoneCategory category="Origin trial" featureDetails={data.originTrial} style={style} />
      <MilestoneCategory category="In developer trial behind flag" featureDetails={data.developerTrial} style={style} />
    </div>
  )
}

function MilestoneCategory ({ category, featureDetails, style = true }: CategoryInput) {
  if (featureDetails.length === 0) return null

  return (
    <div class={style ? "uk-card-body uk-background-secondary uk-light" : ""}>
      <h4>{ category } { featureDetails.length === 0 ? '(None)' : `(${featureDetails.length})`}</h4>
      {
        featureDetails.map(val => (
          <div class={style ? "uk-section uk-padding-small uk-padding-remove-top" : ""}>
            <h5>{ val.name }</h5>
            <p class={style ? "uk-text-meta uk-margin-remove-top formatted" : ""}>
              Category: { val.category }{val.flag_name && val.flag_name.startsWith('--') ? `\nFlag name: ${val.flag_name}` : ''}
            </p>
            <p class={style ? "uk-light formatted" : ""}>{ val.summary }</p>
            {
              style
                ? (
                  <details>
                    <summary>JSON data</summary>
                    <pre><code class="json">{JSON.stringify(val, null, 2)}</code></pre>
                  </details>
                )
                : null
            }
          </div>
        ))
      }
    </div>
  )
}

export interface MilestoneInput {
  detail: MilestonePair['detail']
  data: FeatureData
  style?: boolean
}

interface CategoryInput { category: string; featureDetails: FeatureDetail[]; style?: boolean }
