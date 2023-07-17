/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts";
import { MilestoneEntry, V8Metadata } from "../../backend/V8Metadata.ts";
import { Milestone, MilestoneInput } from "./Milestone.tsx";
import { Meta } from "./Meta.tsx";
import { V8ChangeLog } from "../../backend/v8/V8ChangeLog.ts";
import { V8Release } from "../../backend/v8/V8Release.ts";

function inc(version: string, step = 1) {
  return V8Release.getVersion(V8Release.getMilestone(version) + step);
}

function dec(version: string, step = 1) {
  return V8Release.getVersion(V8Release.getMilestone(version) - step);
}

export function ClogEntry(
  { release, features, origin, changes, v8clog }: MilestoneInput & {
    origin: string;
    v8clog: V8ChangeLog;
  },
) {
  const path = (version: string) => `/clog/${version}`;
  const prevPrev = dec(release.version, 2);
  const prev = dec(release.version);
  const next = inc(release.version);
  const nextNext = inc(release.version, 2);
  const showPrevPrev =
    release.version !== V8Release.getVersion(v8clog.earliest) &&
    prev !== V8Release.getVersion(v8clog.earliest);
  const showPrev = release.version !== V8Release.getVersion(v8clog.earliest);
  const showNext = release.version !== V8Release.getVersion(v8clog.latest);
  const showNextNext =
    release.version !== V8Release.getVersion(v8clog.latest) &&
    next !== V8Release.getVersion(v8clog.latest);

  return (
    <div class="uk-container">
      <Meta
        origin={origin}
        name={`V8 release v${release.version}`}
        path={path(release.version)}
      />
      <Milestone
        release={release}
        features={features}
        changes={changes}
        sep={false}
      />
      <div class="uk-margin-top uk-flex uk-flex-center uk-width-1-1">
        <ul class="uk-iconnav pager">
          <li>
            {showPrevPrev
              ? <a href={path(prevPrev)} uk-icon="chevron-double-left"></a>
              : (
                <span class="uk-icon pager-span" uk-icon="chevron-double-left">
                </span>
              )}
          </li>
          <li>
            {showPrev
              ? <a href={path(prev)} uk-icon="chevron-left"></a>
              : <span class="uk-icon pager-span" uk-icon="chevron-left"></span>}
          </li>
          <li>
            <a href={path(release.version)} uk-icon="table"></a>
          </li>
          <li>
            {showNext
              ? <a href={path(next)} uk-icon="chevron-right"></a>
              : (
                <span class="uk-icon pager-span" uk-icon="chevron-right">
                </span>
              )}
          </li>
          <li>
            {showNextNext
              ? (
                <a
                  href={path(nextNext)}
                  uk-icon="chevron-double-right"
                >
                </a>
              )
              : (
                <span class="uk-icon pager-span" uk-icon="chevron-double-right">
                </span>
              )}
          </li>
        </ul>
      </div>
    </div>
  );
}
