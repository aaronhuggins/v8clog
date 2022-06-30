// deno-lint-ignore-file no-explicit-any ban-types
import { parse } from "https://deno.land/std@0.145.0/path/mod.ts";

export class JSONCollection<D extends {}> {
  #opened = false
  #index = new Map<string, number>()
  #documents: Document<D>[] = []
  #name: string
  #opts: CollectionOpts

  constructor (name: string, opts: CollectionOpts = {}) {
    this.#name = name
    this.#opts = { ...opts }
  }

  get name (): string {
    return this.#name
  }

  get options (): Readonly<CollectionOpts> {
    return Object.freeze(this.#opts)
  }

  #path () {
    let path = this.#name
    if (this.#opts.prefix) path = this.#opts.prefix + this.#name

    return path + (this.#opts.suffix ?? '.db')
  }

  #handleReadResult (result: ReadResult) {
    result.data = JSON.parse(result.file as string)
    delete result.file

    if (
      typeof result.data?.name !== "string" ||
      result.data.name !== this.#name ||
      result.data?.options.prefix !== this.#opts.prefix ||
      result.data?.options.suffix !== this.#opts.suffix
    ) {
      return
    }

    if (typeof result.data?.index === "object") {
      this.#index = new Map<string, number>(Object.entries(result.data?.index ?? {}))
    }

    if (Array.isArray(result.data?.documents)) {
      this.#documents = result.data?.documents
    }

    delete result.data
  }

  async #get (id: string): Promise<Document<D> | undefined> {
    if (!this.#opened) await this.open()

    const index = this.#index.get(id) ?? []

    if (typeof index === "number") return this.#documents[index]
  }

  async #all (op: 'put' | 'delete', items: Iterable<any> | AsyncIterable<any>) {
    if (!this.#opened) await this.open()

    for await (const item of items) await this[op](item)
  }

  /** Open the collection from disk; called by default when making any collection operation. */
  async open () {
    const path = this.#path()
    if (await exists(path)) {
      this.#handleReadResult({
        file: await Deno.readTextFile(path)
      })
    }
    this.#opened = true
  }

  /** Commit the changes to disk. */
  async commit () {
    const path = this.#path()
    const parsed = parse(path)
    const file = JSON.stringify(this)

    if (parsed.dir !== "." && parsed.dir !== "") {
      await Deno.mkdir(parsed.dir, { recursive: true })
    }

    await Deno.writeTextFile(path, file)
  }

  /** Get a document. */
  async get (id: string) {
    const document = await this.#get(id)

    if (document) return document

    throw new Error(`Document with ID ${id} not found.`)
  }

  /** Get all documents in the collection. */
  async * getAll () {
    if (!this.#opened) await this.open()

    for (const doc of this.#documents) yield doc
  }

  /** Create or replace a document. */
  async put (doc: Document<D>) {
    if (!this.#opened) await this.open()

    const id = doc._id
    const index = this.#index.get(id)

    if (typeof index === "number") {
      this.#documents[index] = doc
    } else {
      this.#index.set(id, this.#documents.push(doc) - 1)
    }
  }

  /** Create or replace one or more documents. */
  async putAll (docs: Iterable<Document<D>> | AsyncIterable<Document<D>>) {
    await this.#all('put', docs)
  }

  /** Update or replace a document. */
  async upsert (id: string, handler: (doc: Document<D> | undefined) => (Document<D> | Promise<Document<D>>)) {
    const oldDoc = await this.#get(id)
    const newDoc = await handler(oldDoc)
    await this.put(newDoc)
  }

  async delete (id: string) {
    if (!this.#opened) await this.open()

    const index = this.#index.get(id)

    if (typeof index === "number") {
      this.#index.delete(id)
      this.#documents.splice(index, 1)
      for (const [docId, docIdx] of this.#index.entries()) {
        this.#index.set(docId, docIdx - 1)
      }
    }
  }

  async query (handler: (doc: Document<D>) => (Document<D> | undefined)): Promise<Document<D>[]> {
    if (!this.#opened) await this.open()

    return this.#documents.filter(handler)
  }

  async deleteAll (ids: Iterable<string> | AsyncIterable<string>) {
    await this.#all('delete', ids)
  }

  /** Make an object into a document; performs a shallow clone. Documents *must* be JSON compatible */
  document (id: string, doc: D): Document<D> {
    return {
      _id: id,
      ...doc
    }
  }

  toJSON () {
    return {
      name: this.#name,
      options: { ...this.#opts },
      index: Object.fromEntries(this.#index.entries()),
      documents: this.#documents,
    }
  }
}

async function exists (path: string) {
  try {
    await Deno.stat(path)
    return true
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false
    throw error
  }
}

export type Document<T extends {}> = { _id: string } & T

export interface CollectionOpts {
  prefix?: string
  suffix?: string
}

interface ReadResult {
  file?: string
  data?: {
    name: string
    options: CollectionOpts
    index: Record<string, number>
    documents: any[]
  }
}

class JSONDB {
  #collections = new Map<string, JSONCollection<{}>>()
  #defaults: CollectionOpts

  constructor (opts: CollectionOpts = {}) {
    this.#defaults = { ...opts }
  }

  get<T = {}>(name: string, opts?: CollectionOpts): JSONCollection<T> {
    const hasCol = this.#collections.get(name)
    if (hasCol) return hasCol as any

    const col = new JSONCollection<T>(name, opts ?? this.#defaults)

    this.#collections.set(name, col)

    return col
  }

  async commit () {
    for (const collection of this.#collections.values()) {
      await collection.commit()
    }
  }
}

export const database = new JSONDB({ prefix: "data/" })
