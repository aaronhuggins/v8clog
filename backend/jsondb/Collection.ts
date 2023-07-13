// deno-lint-ignore-file ban-types
import type { Document } from "./types.ts";

export abstract class Collection<D extends {}> {
  #name: string;
  #opts: CollectionOpts;

  constructor(name: string, opts: CollectionOpts = {}) {
    this.#name = name;
    this.#opts = { ...opts };
  }

  get name(): string {
    return this.#name;
  }

  get path(): string {
    let path = this.#name;
    if (this.#opts.prefix) path = this.#opts.prefix + this.#name;

    return path + (this.#opts.suffix ?? ".db");
  }

  get options(): Readonly<CollectionOpts> {
    return Object.freeze(this.#opts);
  }

  /** Make an object into a document; performs a shallow clone. Documents *must* be JSON compatible */
  document(id: string, doc: D): Document<D> {
    return {
      _id: id,
      ...doc,
    };
  }

  abstract open(): Promise<void>;

  abstract commit(): Promise<void>;

  abstract getSafely(id: string): Promise<Document<D> | undefined>;

  abstract get(id: string): Promise<Document<D>>;

  abstract getAll(): AsyncGenerator<Document<D>>;

  abstract put(doc: Document<D>): Promise<void>;

  abstract putAll(
    docs: Iterable<Document<D>> | AsyncIterable<Document<D>>,
  ): Promise<void>;

  abstract delete(id: string): Promise<void>;

  abstract deleteAll(
    ids: Iterable<string> | AsyncIterable<string>,
  ): Promise<void>;

  abstract upsert(
    id: string,
    handler: (
      doc: Document<D> | undefined,
    ) => Document<D> | Promise<Document<D>>,
  ): Promise<void>;

  abstract query(
    handler: (doc: Document<D>) => Document<D> | undefined,
  ): Promise<Document<D>[]>;
}

export interface CollectionOpts {
  prefix?: string;
  suffix?: string;
}
