import type {
  DiffEntry,
  Entity,
  Gitiles,
} from "https://codeberg.org/aaronhuggins/gitiles_client/raw/tag/0.2.0/mod.ts";
import type { ChromestatusAPI } from "../chromestatus/API.ts";
import type { Collection, Document, JSONDB } from "../jsondb/JSONDB.ts";
import { V8Feature } from "./V8Feature.ts";
import { V8Commit } from "./V8Commit.ts";

export type V8ReleaseMeta = {
  stable_date: string;
  milestone: number;
};

export type V8ReleaseOpts =
  & {
    gitiles: Gitiles;
    chromestatus: ChromestatusAPI;
    database: JSONDB;
    stable_date: string;
  }
  & (V8ReleaseMeta | {
    version: string;
  });

export class V8Release {
  static getMilestone(version: string) {
    return Number.parseFloat(version) * 10;
  }

  static getVersion(milestone: number) {
    return (milestone / 10).toFixed(1);
  }

  #gitiles: Gitiles;
  #chromestatus: ChromestatusAPI;
  #database: JSONDB;
  #features: Collection<V8Feature>;
  #changes: Collection<V8Commit>;
  #docQuery = (doc: Document<{ milestone: number }>) =>
    doc.milestone === this.milestone;
  milestone: number;
  version: string;
  stable_date: string;

  constructor(options: V8ReleaseOpts) {
    this.#chromestatus = options.chromestatus;
    this.#database = options.database;
    this.#features = this.#database.get<V8Feature>("v8_features");
    this.#changes = this.#database.get<V8Commit>("v8_changes");
    this.#gitiles = options.gitiles;
    this.stable_date = options.stable_date;
    if ("milestone" in options) {
      this.milestone = options.milestone;
      this.version = V8Release.getVersion(options.milestone);
    } else {
      this.milestone = V8Release.getMilestone(options.version);
      this.version = options.version;
    }
  }

  async features() {
    const features = await this.#features.query(this.#docQuery) ?? [];
    if (features.length > 0) {
      return features.map((doc) => new V8Feature(doc));
    }
    const categories = ["JavaScript", "WebAssembly"];
    const results = await this.#chromestatus.featuresByQuery(
      categories.map((cat) =>
        `browsers.chrome.desktop="${this.milestone}" category="${cat}"`
      ).join(" OR "),
    );
    return await Promise.all(results.features.map(async (feature) => {
      const v8feature = new V8Feature({
        ...(feature as unknown as V8Feature),
        milestone: feature.browsers.chrome.desktop,
      });
      await this.#features.put(
        this.#features.document(`${v8feature.id}`, v8feature),
      );
      return v8feature;
    }));
  }

  async changes() {
    const changes = await this.#changes.query(this.#docQuery) ?? [];
    if (changes.length > 0) {
      return changes.map((doc) => new V8Commit(doc));
    }
    const prevVer = V8Release.getVersion(this.milestone - 1);
    const results = this.#gitiles.getLogs(
      `branch-heads/${prevVer}..branch-heads/${this.version}`,
      {
        noMerges: true,
        limit: 10000,
        treeDiff: true,
      },
    );
    const isAuthor = (author: Entity) =>
      !(/^(V8 Autoroll|v8-ci-autoroll-builder).*$/gui).test(author.name);
    const isV8 = (diffs: DiffEntry[]) =>
      diffs.some((diff) => {
        return (/^include\/v8.*\.h$/gui).test(diff.old_path) ||
          (/^include\/v8.*\.h$/gui).test(diff.new_path);
      });
    const filtered: V8Commit[] = [];
    const promises: Promise<void>[] = [];
    for await (const result of results) {
      if (isAuthor(result.author) && isV8(result.tree_diff)) {
        promises.push((async (): Promise<void> => {
          const v8change = new V8Commit({
            ...result,
            milestone: this.milestone,
          });
          filtered.push(v8change);
          await this.#changes.put(
            this.#changes.document(v8change.commit, v8change),
          );
        })());
      }
    }
    return filtered;
  }

  getMeta(): V8ReleaseMeta {
    return {
      milestone: this.milestone,
      stable_date: this.stable_date,
    };
  }
}
