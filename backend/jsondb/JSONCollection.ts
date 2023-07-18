// deno-lint-ignore-file ban-types no-explicit-any
import { exists, parse } from "../deps.ts";
import { Collection, CollectionOpts } from "./Collection.ts";
import type { Document, DocumentQuery } from "./types.ts";

export class JSONCollection<D extends {}> extends Collection<D> {
  #opened = false;
  #index = new Map<string, number>();
  #documents: Document<D>[] = [];

  #handleReadResult(result: ReadResult) {
    result.data = JSON.parse(result.file as string);
    delete result.file;

    if (
      typeof result.data?.name !== "string" ||
      result.data.name !== this.name ||
      result.data?.options.prefix !== this.options.prefix ||
      result.data?.options.suffix !== this.options.suffix
    ) {
      return;
    }

    if (typeof result.data?.index === "object") {
      this.#index = new Map<string, number>(
        Object.entries(result.data?.index ?? {}),
      );
    }

    if (Array.isArray(result.data?.documents)) {
      this.#documents = result.data?.documents;
    }

    delete result.data;
  }

  async getSafely(id: string): Promise<Document<D> | undefined> {
    if (!this.#opened) await this.open();

    const index = this.#index.get(id) ?? [];

    if (typeof index === "number") return this.#documents[index];
  }

  async #all(op: "put" | "delete", items: Iterable<any> | AsyncIterable<any>) {
    if (!this.#opened) await this.open();

    for await (const item of items) await this[op](item);
  }

  /** Open the collection from disk; called by default when making any collection operation. */
  async open() {
    if (await exists(this.path)) {
      this.#handleReadResult({
        file: await Deno.readTextFile(this.path),
      });
    }
    this.#opened = true;
  }

  /** Commit the changes to disk. */
  async commit() {
    const parsed = parse(this.path);
    const file = JSON.stringify(this);

    if (parsed.dir !== "." && parsed.dir !== "") {
      await Deno.mkdir(parsed.dir, { recursive: true });
    }

    await Deno.writeTextFile(this.path, file);
  }

  /** Get a document. */
  async get(id: string) {
    const document = await this.getSafely(id);

    if (document) return document;

    throw new Error(`Document with ID ${id} not found.`);
  }

  /** Get all documents in the collection. */
  async *getAll() {
    if (!this.#opened) await this.open();

    for (const doc of this.#documents) yield doc;
  }

  /** Create or replace a document. */
  async put(doc: Document<D>) {
    if (!this.#opened) await this.open();

    const id = doc._id;
    const index = this.#index.get(id);

    if (typeof index === "number") {
      this.#documents[index] = doc;
    } else {
      this.#index.set(id, this.#documents.push(doc) - 1);
    }
  }

  /** Create or replace one or more documents. */
  async putAll(
    docs:
      | Iterable<Document<D> | Promise<Document<D>>>
      | AsyncIterable<Document<D>>,
  ) {
    await this.#all("put", docs);
  }

  /** Update or replace a document. */
  async upsert(
    id: string,
    handler: (
      doc: Document<D> | undefined,
    ) => Document<D> | Promise<Document<D>>,
  ) {
    const oldDoc = await this.getSafely(id);
    const newDoc = await handler(oldDoc);
    await this.put(newDoc);
  }

  async delete(id: string) {
    if (!this.#opened) await this.open();

    const index = this.#index.get(id);

    if (typeof index === "number") {
      this.#index.delete(id);
      this.#documents.splice(index, 1);
      for (const [docId, docIdx] of this.#index.entries()) {
        this.#index.set(docId, docIdx - 1);
      }
    }
  }

  async query(handler: DocumentQuery<D>): Promise<Document<D>[]> {
    if (!this.#opened) await this.open();

    return this.#documents.filter(handler);
  }

  async deleteAll(ids: Iterable<string> | AsyncIterable<string>) {
    await this.#all("delete", ids);
  }

  /** Make an object into a document; performs a shallow clone. Documents *must* be JSON compatible */
  document(id: string, doc: D): Document<D> {
    return {
      _id: id,
      ...doc,
    };
  }

  toJSON() {
    return {
      name: this.name,
      options: { ...this.options },
      index: Object.fromEntries(this.#index.entries()),
      documents: this.#documents,
    };
  }
}

interface ReadResult {
  file?: string;
  data?: {
    name: string;
    options: CollectionOpts;
    index: Record<string, number>;
    documents: any[];
  };
}
