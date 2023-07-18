import type { ChromestatusAPI } from "../chromestatus/API.ts";
import type { Collection, Document, JSONDB } from "../jsondb/JSONDB.ts";
import { V8Feature } from "./V8Feature.ts";
import { V8Change } from "./V8Change.ts";
import { V8 } from "../constants.ts";
import { Gitiles } from "../deps.ts";
import { filterTags, isAuthor, isRelevant } from "./filters.ts";
import { V8Tag } from "./V8Tag.ts";

export type V8ReleaseMeta = {
  stable_date: string;
  milestone: number;
  tags: string[];
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
  #changes: Collection<V8Change>;
  #tags: Collection<V8Tag>;
  #docQuery = (doc: Document<{ milestone: number }>) =>
    doc.milestone === this.milestone;
  milestone: number;
  version: string;
  stable_date: string;
  tags: string[];
  features?: V8Feature[];
  changes?: V8Change[];

  constructor(options: V8ReleaseOpts) {
    this.#chromestatus = options.chromestatus;
    this.#database = options.database;
    this.#features = this.#database.get<V8Feature>(V8.FEATURES);
    this.#changes = this.#database.get<V8Change>(V8.CHANGES);
    this.#tags = this.#database.get<V8Tag>(V8.TAGS);
    this.#gitiles = options.gitiles;
    this.stable_date = options.stable_date;
    this.tags = (options as V8ReleaseMeta).tags ?? [];
    if ("milestone" in options) {
      this.milestone = options.milestone;
      this.version = V8Release.getVersion(options.milestone);
    } else {
      this.milestone = V8Release.getMilestone(options.version);
      this.version = options.version;
    }
  }

  async getTags() {
    if (this.tags.length > 0) {
      return this.tags;
    } else {
      if (!this.features) {
        await this.getFeatures();
      }
      if (!this.changes) {
        await this.getChanges();
      }
    }
    const tagSet = new Set<string>(
      this.features!.map((feature) => feature.category),
    );
    for (const change of this.changes ?? []) {
      for (const tag of filterTags(change.subject)) {
        tagSet.add(tag);
      }
    }
    const tags = Array.from(tagSet);
    await this.#tags.putAll(tags.map(async (name) => {
      const tag = await this.#tags.getSafely(name);
      const v8tag = tag ? new V8Tag(tag) : new V8Tag(name);
      v8tag.add(this.milestone);
      return this.#tags.document(name, v8tag);
    }));
    return this.tags = tags;
  }

  async getFeatures() {
    if (this.features) {
      return this.features;
    }
    const features = await this.#features.query(this.#docQuery) ?? [];
    if (features.length === 1) {
      return V8Feature.isNone(features[0])
        ? this.features = []
        : this.features = features.map((doc) => new V8Feature(doc));
    } else if (features.length > 0) {
      return this.features = features.map((doc) => new V8Feature(doc));
    }
    const categories = ["JavaScript", "WebAssembly"];
    const results = await this.#chromestatus.featuresByQuery(
      categories.map((cat) =>
        `browsers.chrome.desktop="${this.milestone}" category="${cat}"`
      ).join(" OR "),
    );
    const mapped = await Promise.all(
      results?.features?.map(async (feature) => {
        const v8feature = new V8Feature({
          ...(feature as unknown as V8Feature),
          milestone: feature.browsers.chrome.desktop,
        });
        await this.#features.put(
          this.#features.document(`${v8feature.id}`, v8feature),
        );
        return v8feature;
      }) ?? [],
    );
    if (mapped.length === 0) {
      await this.#features.put(
        this.#features.document(
          `${this.milestone}`,
          V8Feature.none(this.milestone),
        ),
      );
    }
    return this.features = mapped;
  }

  async getChanges() {
    if (this.changes) {
      return this.changes;
    }
    const changes = await this.#changes.query(this.#docQuery) ?? [];
    if (changes.length === 1) {
      return V8Change.isNone(changes[0])
        ? this.changes = []
        : this.changes = changes.map((doc) => new V8Change(doc));
    } else if (changes.length > 0) {
      return this.changes = changes.map((doc) => new V8Change(doc));
    }
    const prevVer = V8Release.getVersion(this.milestone - 1);
    const results = this.#gitiles.getLogs(
      `branch-heads/${prevVer}..branch-heads/${this.version}`,
      {
        path: "include",
        noMerges: true,
        limit: 10000,
      },
    );
    const promises: Promise<V8Change>[] = [];
    for await (const result of results) {
      if (isAuthor(result.author) && isRelevant(result.message)) {
        promises.push((async (): Promise<V8Change> => {
          const v8change = new V8Change({
            ...result,
            milestone: this.milestone,
          });
          await this.#changes.put(
            this.#changes.document(v8change.commit, v8change),
          );
          return v8change;
        })());
      }
    }
    const filtered = await Promise.all(promises);
    if (filtered.length === 0) {
      await this.#changes.put(
        this.#changes.document(
          `${this.milestone}`,
          V8Change.none(this.milestone),
        ),
      );
    }
    return this.changes = filtered;
  }

  getMeta(): V8ReleaseMeta {
    return {
      milestone: this.milestone,
      stable_date: this.stable_date,
      tags: this.tags,
    };
  }
}
