import { Gitiles } from "https://codeberg.org/aaronhuggins/gitiles_client/raw/tag/0.2.0/mod.ts";
import { ChromestatusAPI } from "../chromestatus/API.ts";
import { DenoKvCollection } from "../jsondb/DenoKvCollection.ts";
import { JSONCollection } from "../jsondb/JSONCollection.ts";
import { JSONDB } from "../jsondb/JSONDB.ts";
import { V8Release } from "./V8Release.ts";

export class V8ChangeLog {
  #gitiles: Gitiles;
  #chromestatus: ChromestatusAPI;
  #database: JSONDB;
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
  }

  getRelease(mstoneOrVersion: number | string) {
    if (typeof mstoneOrVersion === "number") {
      return new V8Release({
        chromestatus: this.#chromestatus,
        database: this.#database,
        gitiles: this.#gitiles,
        milestone: mstoneOrVersion,
      });
    }
    return new V8Release({
      chromestatus: this.#chromestatus,
      database: this.#database,
      gitiles: this.#gitiles,
      version: mstoneOrVersion,
    });
  }

  async getRange(start: number, end?: number) {
    if (!end) {
      const { stable } = await this.#chromestatus.channels();
      end = stable.mstone;
    }
    return Array.from({ length: end - start }, () => this.getRelease(start++));
  }
}
