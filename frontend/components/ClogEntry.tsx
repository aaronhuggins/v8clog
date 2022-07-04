/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts";
import { MilestoneEntry, V8Metadata } from "../../backend/V8Metadata.ts";
import { Milestone } from "./Milestone.tsx";
import { Meta } from "./Meta.tsx";

function inc(version: string, step = 1) {
  return V8Metadata.toV8Version(V8Metadata.toVersion(version) + step);
}

function dec(version: string, step = 1) {
  return V8Metadata.toV8Version(V8Metadata.toVersion(version) - step);
}

export function ClogEntry(
  { detail, features, origin, apiChanges }: MilestoneEntry & { origin: string },
) {
  const path = (version: string) => `/clog/${version}`;
  const prevPrev = dec(detail.mstone, 2);
  const prev = dec(detail.mstone);
  const next = inc(detail.mstone);
  const nextNext = inc(detail.mstone, 2);
  const showPrevPrev = detail.mstone !== V8Metadata.start &&
    prev !== V8Metadata.start;
  const showPrev = detail.mstone !== V8Metadata.start;
  const showNext = detail.mstone !== V8Metadata.end;
  const showNextNext = detail.mstone !== V8Metadata.end &&
    next !== V8Metadata.end;

  return (
    <div class="uk-container">
      <Meta
        origin={origin}
        name={`V8 release v${detail.mstone}`}
        path={path(detail.mstone)}
      />
      <Milestone
        detail={detail}
        apiChanges={apiChanges}
        data={features}
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
            <a href={path(detail.mstone)} uk-icon="table"></a>
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
