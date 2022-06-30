/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"
import { FeatureData } from "../../backend/FeatureData.ts";
import { V8Metadata } from "../../backend/V8Metadata.ts";

const getData = async () => {
  const metadata = new V8Metadata()

  return await metadata.allMilestones()
}
const data = await getData()

export function Clog () {
  return (
    <div class="uk-container">
      <div class="uk-card uk-card-body uk-card-default uk-background-secondary uk-light">
        <h3>Clog post archive</h3>
        <ol reversed>
          {
            data.map((val) => (
              <li class="uk-padding-small uk-padding-remove-top v8-clogroll">
                <a href={`/clog/${val.mstone}`}>V8 release v{val.mstone}</a>
                <time datetime={val.stable_date}> {new Date(val.stable_date).toDateString()}</time>
              </li>
            ))
          }
        </ol>
      </div>
    </div>
  )
}
