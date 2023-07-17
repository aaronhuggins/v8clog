// deno-lint-ignore-file ban-types no-explicit-any
import type { Collection, CollectionOpts } from "./Collection.ts";
import { JSONCollection } from "./JSONCollection.ts";

export * from "./Collection.ts";
export * from "./DenoKvCollection.ts";
export * from "./JSONCollection.ts";
export * from "./types.ts";

type CollectionFactory = {
  new (name: string, opts: CollectionOpts): Collection<{}>;
};

export class JSONDB {
  #collections = new Map<string, Collection<{}>>();
  #defaults: CollectionOpts;
  #factory: CollectionFactory;

  constructor(
    opts: CollectionOpts = {},
    factory: CollectionFactory = JSONCollection,
  ) {
    this.#defaults = { ...opts };
    this.#factory = factory ?? JSONCollection;
  }

  get<T extends {} = {}>(
    name: string,
    opts?: CollectionOpts,
  ): Collection<T> {
    const hasCol = this.#collections.get(name);
    if (hasCol) return hasCol as any;

    const col = new this.#factory(name, opts ?? this.#defaults);

    this.#collections.set(name, col);

    return col as Collection<T>;
  }

  async commit() {
    for (const collection of this.#collections.values()) {
      await collection.commit();
    }
  }
}

export const database = new JSONDB({ prefix: "data/" });
