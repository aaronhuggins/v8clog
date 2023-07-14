// deno-lint-ignore-file ban-types
/// <reference lib="deno.unstable" />
import { Collection } from "./Collection.ts";
import type { Document } from "./types.ts";

export class DenoKvCollection<D extends {}> extends Collection<D> {
  #opened = false;
  #kv?: Deno.Kv;
  #meta: DenoKvMeta = {};

  async #handleMeta(meta?: DenoKvMeta): Promise<void> {
    this.open();
    const key = [`${this.name}::meta`, "meta"] as const;
    const result = await this.#kv!.get<DenoKvMeta>(key);
    if (meta) {
      await this.#kv!.set(key, {
        ...result.value,
        ...meta,
      });
    }
    this.#meta = {
      ...this.#meta,
      ...result.value,
      ...meta,
    };
  }

  #isMultipart(
    doc: Document<D> | null,
  ): doc is MultipartDocument<D> {
    return (doc as MultipartDocument<D> | null)?._isMultipart ?? false;
  }

  async #getMultipart(doc: MultipartDocument<D>): Promise<Document<D>> {
    if (!this.#meta.hasMultipart) {
      await this.#handleMeta({ hasMultipart: true });
    }
    const keys = Array.from(
      { length: doc._chunks },
      (_, i) => [`${this.name}::${doc._id}`, i] as const,
    );
    const results = await this.#kv!.getMany<MultipartChunk[]>(keys);
    return JSON.parse(results.map((item) => item.value?._content).join(""));
  }

  async #putMultipart(doc: Document<D>): Promise<void> {
    if (!this.#meta.hasMultipart) {
      await this.#handleMeta({ hasMultipart: true });
    }
    const atomic = this.#kv!.atomic();
    const json = JSON.stringify(doc);
    const size = 57344;
    let id = 0;
    for (let i = 0; i < json.length; i += size, id++) {
      const slice = json.slice(i, i + size);
      atomic.set([`${this.name}::${doc._id}`, id], {
        _id: id.toString(),
        _docId: doc._id,
        _content: slice,
      } as MultipartChunk);
    }
    atomic.set([this.name, doc._id], {
      _id: doc._id,
      _isMultipart: true,
      _chunks: id,
    } as MultipartDocument<D>);
    await atomic.commit();
  }

  async #deleteMultipart(doc: MultipartDocument<D>) {
    const atomic = this.#kv!.atomic();
    this.#deleteMultipartWith(doc, atomic);
    await atomic.commit();
  }

  #deleteMultipartWith(
    doc: MultipartDocument<D>,
    atomic: Deno.AtomicOperation,
  ) {
    const keys = Array.from(
      { length: doc._chunks },
      (_, i) => [`${this.name}::${doc._id}`, i] as const,
    );
    for (const key of keys) {
      atomic.delete(key);
    }
    atomic.delete([this.name, doc._id]);
  }

  async open(): Promise<void> {
    if (!this.#opened) {
      this.#kv = await Deno.openKv(this.path);
      this.#handleMeta();
    }
  }

  async commit(): Promise<void> {
  }

  async getSafely(id: string): Promise<Document<D> | undefined> {
    await this.open();
    const { value } = await this.#kv!.get<Document<D>>([this.name, id]);
    if (this.#isMultipart(value)) {
      return await this.#getMultipart(value);
    }
    return value ?? undefined;
  }

  async get(id: string): Promise<Document<D>> {
    const document = await this.getSafely(id);

    if (document) return document;

    throw new Error(`Document with ID ${id} not found.`);
  }

  async *getAll(): AsyncGenerator<Document<D>> {
    await this.open();
    const results = this.#kv!.list<Document<D>>({ prefix: [this.name] });
    for await (const entry of results) {
      if (this.#isMultipart(entry.value)) {
        yield await this.#getMultipart(entry.value);
      } else {
        yield entry.value;
      }
    }
  }

  async put(doc: Document<D>): Promise<void> {
    await this.open();
    try {
      await this.#kv!.set([this.name, doc._id], doc);
    } catch (err) {
      if (
        err instanceof TypeError &&
        err.message.startsWith("value too large")
      ) {
        await this.#putMultipart(doc);
      } else {
        throw err;
      }
    }
  }

  async putAll(
    docs: Iterable<Document<D>> | AsyncIterable<Document<D>>,
  ): Promise<void> {
    await this.open();
    try {
      const atomic = this.#kv!.atomic();
      for await (const doc of docs) {
        atomic.set([this.name, doc._id], doc);
      }
      await atomic.commit();
    } catch (err) {
      if (
        err instanceof TypeError &&
        err.message.startsWith("value too large")
      ) {
        for await (const doc of docs) {
          await this.#putMultipart(doc);
        }
      } else {
        throw err;
      }
    }
  }

  async delete(id: string): Promise<void> {
    await this.open();
    if (this.#meta.hasMultipart) {
      const result = await this.#kv!.get<Document<D>>([this.name, id]);
      if (this.#isMultipart(result.value)) {
        return await this.#deleteMultipart(result.value);
      }
    }
    await this.#kv!.delete([this.name, id]);
  }

  async deleteAll(
    ids: Iterable<string> | AsyncIterable<string>,
  ): Promise<void> {
    await this.open();
    const atomic = this.#kv!.atomic();
    for await (const id of ids) {
      if (this.#meta.hasMultipart) {
        const result = await this.#kv!.get<Document<D>>([this.name, id]);
        if (this.#isMultipart(result.value)) {
          this.#deleteMultipartWith(result.value, atomic);
          continue;
        }
      }
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

type DenoKvMeta = {
  hasMultipart?: boolean;
};

type MultipartDocument<D extends {}> = {
  _isMultipart: true;
  _chunks: number;
} & Document<D>;

type MultipartChunk = Document<{
  _docId: string;
  _content: string;
}>;
