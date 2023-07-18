import { ChromestatusAPI } from "../chromestatus/API.ts";
import { DenoKvCollection } from "../jsondb/DenoKvCollection.ts";
import { JSONCollection } from "../jsondb/JSONCollection.ts";
import { Collection, JSONDB } from "../jsondb/JSONDB.ts";
import { V8Release, V8ReleaseMeta } from "./V8Release.ts";
import { V8Feature } from "./V8Feature.ts";
import { V8Change } from "./V8Change.ts";
import { V8 } from "../constants.ts";
import { Gitiles } from "../deps.ts";
import { isAuthor, isRelevant } from "./filters.ts";

const MIN_MILESTONE = 7;

export class V8ChangeLog {
  #gitiles: Gitiles;
  #chromestatus: ChromestatusAPI;
  #database: JSONDB;
  #releases: Collection<V8ReleaseMeta>;
  latest = 114;
  earliest = MIN_MILESTONE;
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
    const release = new V8Release({
      chromestatus: this.#chromestatus,
      database: this.#database,
      gitiles: this.#gitiles,
      stable_date: stable.stable_date,
      milestone: stable.mstone,
    });
    await this.#cacheRelease(release);
    return release;
  }

  async getRelease(
    mstoneOrVersion: number | string,
    stable_date?: string,
  ): Promise<V8Release> {
    const milestone = typeof mstoneOrVersion === "number"
      ? Math.max(mstoneOrVersion, MIN_MILESTONE)
      : Math.max(V8Release.getMilestone(mstoneOrVersion), MIN_MILESTONE);
    const meta = await this.#releases.getSafely(milestone.toString());
    if (meta) {
      return this.#metaRelease(meta);
    }
    if (!stable_date) {
      const result = await this.#chromestatus.channels({
        start: milestone,
        end: milestone,
      });
      stable_date = result[milestone].stable_date;
    }
    return new V8Release({
      chromestatus: this.#chromestatus,
      database: this.#database,
      gitiles: this.#gitiles,
      stable_date,
      milestone,
    });
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
    start = Math.max(start, MIN_MILESTONE);
    end = Math.max(end, MIN_MILESTONE);
    const length = end - start === 0
      ? 1
      : start === MIN_MILESTONE
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
      return this.getRelease(milestone, result[milestone].stable_date);
    }));
  }

  async getAllData(start: number, end: number) {
    const featuresCol = this.#database.get<V8Feature>(V8.FEATURES);
    const changesCol = this.#database.get<V8Change>(V8.CHANGES);
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
          if (isAuthor(result.author) && isRelevant(result.message)) {
            changes.push(
              new V8Change({
                ...result,
                milestone,
              }),
            );
          }
        }
        changeMap.set(milestone, changes);
      };
      const limit = 50;
      let promises: Promise<void>[] = [];
      for (let i = start; !(i > end); i++) {
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
    for (const release of releases) {
      release.changes = changes.get(release.milestone);
      release.features = features.get(release.milestone) ?? [];
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
    await changesCol.putAll(
      Array.from(changes.values()).flat().map((change) =>
        changesCol.document(change.commit, change)
      ),
    );
    await featuresCol.putAll(
      Array.from(features.values()).flat().map((feature) =>
        featuresCol.document(`${feature.id}`, feature)
      ),
    );
    await this.#releases.putAll(
      releases.map((release) =>
        this.#releases.document(`${release.milestone}`, release.getMeta())
      ),
    );
    return releases;
  }

  async commit() {
    await this.#database.commit();
  }
}
