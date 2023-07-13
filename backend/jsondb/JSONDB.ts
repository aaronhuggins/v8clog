// deno-lint-ignore-file ban-types no-explicit-any
import type { CollectionOpts } from "./Collection.ts";
import { JSONCollection } from "./JSONCollection.ts";

export class JSONDB {
  #collections = new Map<string, JSONCollection<{}>>();
  #defaults: CollectionOpts;

  constructor(opts: CollectionOpts = {}) {
    this.#defaults = { ...opts };
  }

  get<T extends {} = {}>(
    name: string,
    opts?: CollectionOpts,
  ): JSONCollection<T> {
    const hasCol = this.#collections.get(name);
    if (hasCol) return hasCol as any;

    const col = new JSONCollection<T>(name, opts ?? this.#defaults);

    this.#collections.set(name, col);

    return col;
  }

  async commit() {
    for (const collection of this.#collections.values()) {
      await collection.commit();
    }
  }
}

export const database = new JSONDB({ prefix: "data/" });
