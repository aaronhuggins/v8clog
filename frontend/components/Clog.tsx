/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts";
import { Meta } from "./Meta.tsx";
import { V8Release } from "../../backend/v8/V8Release.ts";

export function Clog(
  { origin, data, start }: { origin: string; data: V8Release[]; start: number },
) {
  const name = "Clog post archive";

  return (
    <div class="uk-container">
      <Meta origin={origin} name={name} path="/clog" />
      <div class="uk-card uk-card-body uk-card-default uk-background-secondary uk-light">
        <h3>{name}</h3>
        <ol start={start} reversed>
          {data.map((val) => {
            return (
              <li class="uk-padding-small uk-padding-remove-top v8-clogroll">
                <a href={`/clog/${val.version}`}>
                  V8 release v{val.version}
                </a>
                <time
                  class="uk-margin-small-left"
                  datetime={val.stable_date}
                >
                  {new Date(val.stable_date).toDateString()}
                </time>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
