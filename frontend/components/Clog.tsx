/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts"
import { V8Metadata } from "../../backend/V8Metadata.ts";
import { Meta } from "./Meta.tsx";

const getData = async () => {
  const metadata = new V8Metadata()

  return await metadata.allMilestones()
}
const data = await getData()

export function Clog ({ origin }: { origin: string }) {
  const name = "Clog post archive"
  const site = "V8 Clog"
  return (
    <div class="uk-container">
      <Meta origin={origin} name={name} path="/clog" />
      <div class="uk-card uk-card-body uk-card-default uk-background-secondary uk-light">
        <h3>{name}</h3>
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
