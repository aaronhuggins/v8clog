// deno-lint-ignore-file ban-types
/// <reference lib="deno.unstable" />
import { Collection } from "./Collection.ts";
import type { Document } from "./types.ts";

export class DenoKvCollection<D extends {}> extends Collection<D> {
  #opened = false;
  #kv?: Deno.Kv;

  async open(): Promise<void> {
    if (!this.#opened) {
      this.#kv = await Deno.openKv(this.path);
    }
  }

  async commit(): Promise<void> {
  }

  async getSafely(id: string): Promise<Document<D> | undefined> {
    await this.open();
    const result = await this.#kv!.get<Document<D>>([this.name, id]);
    return result.value ?? undefined;
  }

  async get(id: string): Promise<Document<D>> {
    const document = await this.getSafely(id);

    if (document) return document;

    throw new Error(`Document with ID ${id} not found.`);
  }

  async *getAll(): AsyncGenerator<Document<D>> {
    await this.open();
    const results = await this.#kv!.list<Document<D>>({ prefix: [this.name] });
    for await (const entry of results) {
      yield entry.value;
    }
  }

  async put(doc: Document<D>): Promise<void> {
    await this.open();
    this.#kv!.set([this.name, doc._id], doc);
  }

  async putAll(
    docs: Iterable<Document<D>> | AsyncIterable<Document<D>>,
  ): Promise<void> {
    await this.open();
    const atomic = this.#kv!.atomic();
    for await (const doc of docs) {
      atomic.set([this.name, doc._id], doc);
    }
    await atomic.commit();
  }

  async delete(id: string): Promise<void> {
    await this.open();
    await this.#kv!.delete([this.name, id]);
  }

  async deleteAll(
    ids: Iterable<string> | AsyncIterable<string>,
  ): Promise<void> {
    await this.open();
    const atomic = this.#kv!.atomic();
    for await (const id of ids) {
      atomic.delete([this.name, id]);
    }
    await atomic.commit();
  }

  async upsert(
    id: string,
    handler: (
      doc: Document<D> | undefined,
    ) => Document<D> | Promise<Document<D>>,
  ): Promise<void> {
    const oldDoc = await this.getSafely(id);
    const newDoc = await handler(oldDoc);
    await this.put(newDoc);
  }

  async query(
    handler: (doc: Document<D>) => Document<D> | undefined,
  ): Promise<Document<D>[]> {
    const results: Document<D>[] = [];
    for await (const doc of this.getAll()) {
      if (handler(doc)) {
        results.push(doc);
      }
    }
    return results;
  }
}
