/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts";
import { Meta } from "./Meta.tsx";
import { V8Release } from "../../backend/v8/V8Release.ts";
import { V8ChangeLog } from "../../backend/v8/V8ChangeLog.ts";

export function Clog(
  { origin, data, milestone, limit, v8clog }: {
    origin: string;
    data: V8Release[];
    milestone: number;
    limit: number;
    v8clog: V8ChangeLog;
  },
) {
  const name = "Clog post archive";
  const prev = Math.min(milestone + limit, v8clog.latest);
  const next = Math.max(milestone - limit, v8clog.earliest);
  const path = (milestone: number) =>
    `/clog?milestone=${milestone}&limit=${limit}`;

  return (
    <div class="uk-container">
      <Meta origin={origin} name={name} path="/clog" />
      <div class="uk-card uk-card-body uk-card-default uk-background-secondary uk-light">
        <h3>{name}</h3>
        <ol start={milestone} reversed>
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
      <div class="uk-margin-top uk-flex uk-flex-center uk-width-1-1">
        <ul class="uk-iconnav pager">
          <li>
            {milestone !== v8clog.latest
              ? <a href={path(prev)} uk-icon="chevron-left"></a>
              : <span class="uk-icon pager-span" uk-icon="chevron-left"></span>}
          </li>
          <li>
            <a href={path(milestone)} uk-icon="table"></a>
          </li>
          <li>
            {data[data.length - 1].milestone !== v8clog.earliest
              ? <a href={path(next)} uk-icon="chevron-right"></a>
              : (
                <span class="uk-icon pager-span" uk-icon="chevron-right">
                </span>
              )}
          </li>
        </ul>
      </div>
    </div>
  );
}
