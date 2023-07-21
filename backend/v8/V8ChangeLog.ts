import { ChromestatusAPI } from "../chromestatus/API.ts";
import { DenoKvCollection } from "../jsondb/DenoKvCollection.ts";
import { JSONCollection } from "../jsondb/JSONCollection.ts";
import { Collection, JSONDB } from "../jsondb/JSONDB.ts";
import { V8Release, V8ReleaseMeta } from "./V8Release.ts";
import { V8Feature } from "./V8Feature.ts";
import { V8Change } from "./V8Change.ts";
import { V8 } from "../constants.ts";
import { Gitiles } from "../deps.ts";
import { isValidChange, subjectTags } from "./filters.ts";
import { V8Tag } from "./V8Tag.ts";

export class V8ChangeLog {
  #gitiles: Gitiles;
  #chromestatus: ChromestatusAPI;
  #database: JSONDB;
  #releases: Collection<V8ReleaseMeta>;
  #tags: Collection<V8Tag>;
  latest = 114;
  earliest = 1;
  constructor(backend: "json" | "deno_kv") {
    this.#chromestatus = new ChromestatusAPI();
    this.#database = new JSONDB(
      { prefix: "data/" },
      backend === "deno_kv" ? DenoKvCollection : JSONCollection,
    );
    this.#gitiles = new Gitiles({
      url: "https://chromium.googlesource.com/v8/v8.git",
      rate: 3,
    });
    this.#releases = this.#database.get<V8ReleaseMeta>(V8.RELEASES);
    this.#tags = this.#database.get<V8Tag>(V8.TAGS);
  }

  async #cacheRelease(release: V8Release) {
    if (!(await this.#releases.getSafely(release.milestone.toString()))) {
      await this.#releases.put(
        this.#releases.document(
          release.milestone.toString(),
          release.getMeta(),
        ),
      );
    }
  }

  #metaRelease(meta: V8ReleaseMeta) {
    return new V8Release({
      chromestatus: this.#chromestatus,
      database: this.#database,
      gitiles: this.#gitiles,
      ...meta,
    });
  }

  async getLatest(): Promise<V8Release> {
    const { stable } = await this.#chromestatus.channels();
    this.latest = stable.mstone;
    const release = new V8Release({
      chromestatus: this.#chromestatus,
      database: this.#database,
      gitiles: this.#gitiles,
      stable_date: stable.stable_date,
      milestone: stable.mstone,
      tags: [],
    });
    await this.#cacheRelease(release);
    return release;
  }

  async getRelease(
    mstoneOrVersion: number | string,
    stable_date?: string,
  ): Promise<V8Release> {
    const milestone = typeof mstoneOrVersion === "number"
      ? Math.max(mstoneOrVersion, 1)
      : Math.max(V8Release.getMilestone(mstoneOrVersion), 1);
    const meta = await this.#releases.getSafely(milestone.toString());
    if (meta) {
      return this.#metaRelease(meta);
    }
    if (stable_date === null) {
      stable_date = new Date(stable_date as unknown as string).toISOString();
    }
    if (stable_date === undefined) {
      const result = await this.#chromestatus.channels({
        start: milestone,
        end: milestone,
      });
      stable_date = new Date(result[milestone]?.stable_date ?? null)
        .toISOString();
    }
    return new V8Release({
      chromestatus: this.#chromestatus,
      database: this.#database,
      gitiles: this.#gitiles,
      tags: [],
      stable_date,
      milestone,
    });
  }

  async getByTag(tagname: string): Promise<V8Release[]> {
    const tag = await this.#tags.getSafely(tagname.toLowerCase());
    if (tag) {
      return Promise.all(
        tag.milestones.map((milestone) => this.getRelease(milestone)),
      );
    }
    return [];
  }

  async getTags(): Promise<V8Tag[]> {
    const tags: V8Tag[] = [];
    for await (const tag of this.#tags.getAll()) {
      tags.push(new V8Tag(tag));
    }
    return tags;
  }

  async getRange(start: number, end?: number): Promise<V8Release[]> {
    if (!end) {
      const { stable } = await this.#chromestatus.channels();
      end = stable.mstone;
    } else {
      if (end < start) {
        const newStart = end;
        end = start;
        start = newStart;
      }
    }
    start = Math.max(start, 1);
    end = Math.max(end, 1);
    const length = end - start === 0
      ? 1
      : start === 1
      ? end - start + 1
      : end - start;
    const metas = await this.#releases.query((doc) =>
      doc.milestone >= start && doc.milestone <= end!
    );
    if (metas.length === length) {
      return metas.map((doc) => this.#metaRelease(doc));
    }
    const result = await this.#chromestatus.channels({ start, end });
    return await Promise.all(Array.from({ length }, () => {
      const milestone = end!--;
      return this.getRelease(milestone, result[milestone]?.stable_date);
    }));
  }

  async getAllData(start: number, end: number) {
    const featuresCol = this.#database.get<V8Feature>(V8.FEATURES);
    const changesCol = this.#database.get<V8Change>(V8.CHANGES);
    const skippable = new Map<number, V8Release>();
    for (let i = start; !(i > end); i++) {
      const hasRelease = await this.#releases.getSafely(`${i}`);
      if (hasRelease) {
        const hasFeatures = await featuresCol.query((doc) =>
          doc.milestone === i
        );
        const hasChanges = await changesCol.query((doc) => doc.milestone === i);
        if (hasFeatures.length > 0 && hasChanges.length > 0) {
          const release = this.#metaRelease(hasRelease);
          release.features = V8Feature.isNone(hasFeatures[0])
            ? []
            : hasFeatures.map((doc) => new V8Feature(doc));
          release.changes = V8Change.isNone(hasChanges[0])
            ? []
            : hasChanges.map((doc) => new V8Change(doc));
          skippable.set(i, release);
        }
      }
    }
    if (skippable.size === end - start + 1) {
      return Array.from(skippable.values()).reverse();
    }
    const getAllFeatures = async () => {
      const [js, wasm] = await Promise.all([
        this.#chromestatus.featuresByQuery('category="JavaScript"'),
        this.#chromestatus.featuresByQuery('category="WebAssembly"'),
      ]);
      const featureMap = new Map<number, V8Feature[]>();
      const pushFeatures = (results: typeof js["features"]) => {
        for (const feature of results) {
          const { milestone_str } = feature.browsers.chrome.status;
          const statusMilestone = Number.parseFloat(milestone_str ?? "NaN");
          if (
            feature.browsers.chrome.desktop ?? !Number.isNaN(statusMilestone)
          ) {
            const milestone = feature.browsers.chrome.desktop ??
              statusMilestone;
            const features = featureMap.get(milestone) ?? [];
            features.push(
              new V8Feature({
                ...(feature as unknown as V8Feature),
                milestone,
              }),
            );
            featureMap.set(milestone, features);
          }
        }
      };
      pushFeatures(js.features);
      pushFeatures(wasm.features);
      return featureMap;
    };
    const getAllChanges = async () => {
      const changeMap = new Map<number, V8Change[]>();
      const getChanges = async (
        previous: string,
        version: string,
        milestone: number,
      ) => {
        const changes: V8Change[] = [];
        const results = this.#gitiles.getLogs(
          `branch-heads/${previous}..branch-heads/${version}`,
          {
            path: "include",
            noMerges: true,
            limit: 10000,
          },
        );
        for await (const result of results) {
          const v8Change = new V8Change({
            ...result,
            milestone,
          });
          if (isValidChange(v8Change)) {
            changes.push(v8Change);
          }
        }
        changeMap.set(milestone, changes);
      };
      const limit = 50;
      let promises: Promise<void>[] = [];
      for (let i = start; !(i > end); i++) {
        if (skippable.has(i)) {
          continue;
        }
        const previous = V8Release.getVersion(i - 1);
        const version = V8Release.getVersion(i);
        promises.push(getChanges(previous, version, i));
        if (promises.length === limit) {
          await Promise.all(promises);
          promises = [];
        }
      }
      if (promises.length > 0) {
        await Promise.all(promises);
        promises = [];
      }
      return changeMap;
    };
    const [releases, changes, features] = await Promise.all([
      this.getRange(start, end),
      getAllChanges(),
      getAllFeatures(),
    ]);
    const tagsMap = new Map<string, V8Tag>();
    for (let i = 0; i < releases.length; i++) {
      const release = releases[i];
      if (skippable.has(release.milestone)) {
        releases[i] = skippable.get(release.milestone)!;
        continue;
      }
      release.changes = changes.get(release.milestone);
      release.features = features.get(release.milestone) ?? [];
      const tagSet = new Set<string>(
        release.features!.map((feature) => feature.category.toLowerCase()),
      );
      for (const change of release.changes ?? []) {
        for (const tag of subjectTags(change.subject)) {
          tagSet.add(tag);
        }
      }
      release.tags = Array.from(tagSet).sort();
      for (const name of release.tags) {
        const tag = tagsMap.get(name);
        const v8tag = tag ? new V8Tag(tag) : new V8Tag(name);
        v8tag.add(release.milestone);
        tagsMap.set(name, v8tag);
      }
      if (release.changes!.length === 0) {
        await changesCol.put(
          changesCol.document(
            `${release.milestone}`,
            V8Change.none(release.milestone),
          ),
        );
      }
      if (release.features!.length === 0) {
        await featuresCol.put(
          featuresCol.document(
            `${release.milestone}`,
            V8Feature.none(release.milestone),
          ),
        );
      }
    }
    await Promise.all([
      this.#tags.putAll(
        Array.from(
          tagsMap.values(),
          (tag) => this.#tags.document(tag.name, tag),
        ),
      ),
      changesCol.putAll(
        Array.from(changes.values()).flat().map((change) =>
          changesCol.document(change.commit, change)
        ),
      ),
      featuresCol.putAll(
        Array.from(features.values()).flat().map((feature) =>
          featuresCol.document(`${feature.id}`, feature)
        ),
      ),
      this.#releases.putAll(
        releases.map((release) =>
          this.#releases.document(`${release.milestone}`, release.getMeta())
        ),
      ),
    ]);
    return releases;
  }

  async commit() {
    await this.#database.commit();
  }
}
