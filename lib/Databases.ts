// deno-lint-ignore-file no-explicit-any
import PouchDB from "https://deno.land/x/pouchdb_deno@2.1.0-PouchDB+7.3.0/modules/pouchdb/mod.ts";
import { PouchDB as IPouchDB } from "https://deno.land/x/pouchdb_deno@2.1.0-PouchDB+7.3.0/modules/pouchdb/mod.ts";

class Database {
  #collections = new Map<string, IPouchDB.Database>()

  constructor (preload: string[] = []) {
    for (const name of preload) {
      this.collection.create(name)
    }
  }

  get collection () {
    return {
      get: (name: string) => {
        return this.collection.create(name)
      },

      create: (name: string) => {
        const hasDb = this.#collections.get(name)
        if (hasDb) return hasDb

        const db = new PouchDB(name, {
          adapter: "idb",
          prefix: "data/",
          systemPath: "data/"
        })

        this.#collections.set(name, db)

        return db
      }
    }
  }

  get record () {
    return {
      create: <T>(_id: string, record: T): T & { _id: string; _rev: any } => {
        return {
          ...record,
          _id,
          _rev: undefined
        }
      }
    }
  }
}

export const database = new Database([
  "channels",
  "features"
])
