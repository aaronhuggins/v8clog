/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts";
import { V8Metadata } from "../../backend/V8Metadata.ts";
import { Meta } from "./Meta.tsx";

const getData = async () => {
  const metadata = new V8Metadata();

  return await metadata.allMilestoneEntries();
};
const data = await getData();

export function Clog({ origin }: { origin: string }) {
  const name = "Clog post archive";

  return (
    <div class="uk-container">
      <Meta origin={origin} name={name} path="/clog" />
      <div class="uk-card uk-card-body uk-card-default uk-background-secondary uk-light">
        <h3>{name}</h3>
        <ol reversed>
          {data.map((val) => {
            if (val.detail.stable_date === null) return null;
            return (
              <li class="uk-padding-small uk-padding-remove-top v8-clogroll">
                <a href={`/clog/${val.detail.mstone}`}>
                  V8 release v{val.detail.mstone}
                </a>
                <time
                  class="uk-margin-small-left"
                  datetime={val.detail.stable_date}
                >
                  {new Date(val.detail.stable_date).toDateString()}
                </time>
                {val.features.hasFeatures
                  ? val.features.tags.map((tag) => (
                    <span class="uk-label uk-margin-small-left">{tag}</span>
                  ))
                  : (
                    <span class="uk-label uk-label-danger uk-margin-small-left">
                      No New Features
                    </span>
                  )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
