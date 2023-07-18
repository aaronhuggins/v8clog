/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { V8Release } from "../../backend/v8/V8Release.ts";
import { h } from "../jsx.ts";

export function Milestone(
  { release, style = true, sep = true }: MilestoneInput,
) {
  return (
    <div>
      <div
        class={style
          ? "uk-card uk-card-body uk-card-default uk-padding-small uk-background-secondary uk-light"
          : ""}
      >
        <div class={style ? "uk-card-header" : ""}>
          <h3>
            <a href={`/clog/${release.version}`}>
              V8 release v{release.version}
            </a>
          </h3>
          <p class={style ? "uk-text-meta uk-margin-remove-top" : ""}>
            Stable date:{" "}
            <time datetime={release.stable_date}>
              {new Date(release.stable_date).toDateString()}
            </time>
          </p>
          {release.features!.length > 0
            ? (
              <p class={style ? "uk-text-meta uk-margin-remove-top" : ""}>
                Tags:
                {Array.from(
                  new Set(release.features!.map((feat) => feat.category)),
                  (tag) => (
                    <span class="uk-label uk-margin-small-left">{tag}</span>
                  ),
                )}
              </p>
            )
            : null}
        </div>
        <MilestoneBody release={release} style={style} />
        <div class={style ? "uk-card-footer" : ""}>
          <p>
            <a href={`/clog/${release.version}`}>Permalink</a>
          </p>
        </div>
      </div>
      {sep ? <hr></hr> : null}
    </div>
  );
}

export function MilestoneBody(
  { release, style = true }: MilestoneInput,
) {
  return (
    <div>
      {release.features!.length > 0
        ? null
        : (
          <div class={style ? "uk-card-body" : ""}>
            <p>No new features in this version.</p>
          </div>
        )}
      <MilestoneFeatures
        release={release}
        style={style}
      />
      <MilestoneAPIChanges release={release} style={style} />
    </div>
  );
}

function MilestoneFeatures(
  { release, style = true }: CategoryInput,
) {
  const features = release.features!;
  if (features.length === 0) return null;

  return (
    <div class={style ? "uk-card-body uk-background-secondary uk-light" : ""}>
      <h4>
        Features {features.length === 0 ? "(None)" : `(${features.length})`}
      </h4>
      {features.map((val) => (
        <div
          class={style
            ? "uk-section uk-padding-small uk-padding-remove-top"
            : ""}
        >
          <h5>{val.name}</h5>
          <p class={style ? "uk-text-meta uk-margin-remove-top formatted" : ""}>
            Category: {val.category}
            {val.flag_name && val.flag_name.startsWith("--")
              ? `\nFlag name: ${val.flag_name}`
              : ""}
          </p>
          <p class={style ? "uk-light formatted" : ""}>{val.summary}</p>
          {style
            ? (
              <details>
                <summary>JSON data</summary>
                <pre>
                  <code class="json">{JSON.stringify(val, null, 2)}</code>
                </pre>
              </details>
            )
            : null}
        </div>
      ))}
    </div>
  );
}

function MilestoneAPIChanges(
  { release, style = true }: { release: V8Release; style?: boolean },
) {
  const changes = release.changes;
  if (!changes || changes.length === 0) return null;

  return (
    <div class={style ? "uk-card-body uk-background-secondary uk-light" : ""}>
      <h4>
        {`API Changes (${changes.length})`}
      </h4>
      <ul>
        {changes.map((val) => {
          return <li>{val.subject}</li>;
        })}
      </ul>
      {style
        ? (
          <details>
            <summary>JSON data</summary>
            <pre>
              <code class="json">
                {JSON.stringify(changes, null, 2)}
              </code>
            </pre>
          </details>
        )
        : null}
    </div>
  );
}

export interface MilestoneInput {
  release: V8Release;
  style?: boolean;
  sep?: boolean;
}

interface CategoryInput {
  release: V8Release;
  style?: boolean;
}
