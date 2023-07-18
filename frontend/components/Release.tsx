/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { V8Release } from "../../backend/v8/V8Release.ts";
import { h } from "../jsx.ts";

export function Release(
  { release, style = true, sep = true }: ReleaseInput,
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
          {release.tags.length > 0
            ? (
              <p class={style ? "uk-text-meta uk-margin-remove-top" : ""}>
                Tags:
                {release.tags.map((tag) => (
                  <span class="uk-label uk-margin-small-left">{tag}</span>
                ))}
              </p>
            )
            : null}
        </div>
        <ReleaseBody release={release} style={style} />
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

export function ReleaseBody(
  { release, style = true }: ReleaseInput,
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
      <ReleaseFeatures
        release={release}
        style={style}
      />
      <ReleaseChanges release={release} style={style} />
    </div>
  );
}

function ReleaseFeatures(
  { release, style = true }: FeatureInput,
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

function ReleaseChanges(
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

export interface ReleaseInput {
  release: V8Release;
  style?: boolean;
  sep?: boolean;
}

interface FeatureInput {
  release: V8Release;
  style?: boolean;
}
