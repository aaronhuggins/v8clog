import { Gitiles } from "https://codeberg.org/aaronhuggins/gitiles_client/raw/tag/0.2.0/mod.ts";
import { ChromestatusAPI } from "../chromestatus/API.ts";
import { DenoKvCollection } from "../jsondb/DenoKvCollection.ts";
import { JSONCollection } from "../jsondb/JSONCollection.ts";
import { Collection, JSONDB } from "../jsondb/JSONDB.ts";
import { V8Release, V8ReleaseMeta } from "./V8Release.ts";

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
    this.#releases = this.#database.get<V8ReleaseMeta>("v8_releases");
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
    const length = end - start;
    const metas = await this.#releases.query((doc) =>
      doc.milestone >= start && doc.milestone <= end!
    );
    if (metas.length === length) {
      return metas.map((doc) => this.#metaRelease(doc));
    }
    const result = await this.#chromestatus.channels({ start, end });
    return await Promise.all(Array.from({ length: end - start }, () => {
      const milestone = end!--;
      return this.getRelease(milestone, result[milestone].stable_date);
    }));
  }
}
