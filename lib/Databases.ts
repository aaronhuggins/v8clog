// deno-lint-ignore-file no-explicit-any
import { IS_DENO_DEPLOY } from "./constants.ts";
import PouchDB from "https://deno.land/x/pouchdb_deno@2.1.3-PouchDB+7.3.0/modules/pouchdb/mod.ts";
import { PouchDB as IPouchDB } from "https://deno.land/x/pouchdb_deno@2.1.3-PouchDB+7.3.0/modules/pouchdb/mod.ts";

class Database {
  #collections = new Map<string, IPouchDB.Database<any>>()

  constructor (preload: string[] = []) {
    for (const name of preload) {
      this.collection.create(name)
    }
  }

  get collection () {
    return {
      get: <T = any>(name: string): IPouchDB.Database<T> => {
        return this.collection.create(name)
      },

      create: <T = any>(name: string): IPouchDB.Database<T> => {
        const hasDb = this.#collections.get(name)
        if (hasDb) return hasDb

        const db = new PouchDB<any>(name, {
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

// if (IS_DENO_DEPLOY) {
  const fileRidMap = new Map<string, Deno.FsFile>()
  const ridFileMap = new Map<number, string>()
  const openSync = Deno.openSync
  const close = Deno.close
  const files = [
    "data/__sysdb__.sqlite",
    "data/channels.sqlite",
    "data/channels.sqlite-journal",
    "data/features.sqlite",
    "data/features.sqlite-journal"
  ]

  for (const file of files) {
    try {
      const fs = await Deno.open(file, { read: true })
      fileRidMap.set(file, fs)
      ridFileMap.set(fs.rid, file)
    } catch (_err) { /* Don't care */ }
  }

  Deno.openSync = (path: string | URL, options?: Deno.OpenOptions | undefined) => {
    const fs = fileRidMap.get(path.toString())
    if (fs) return fs
    return openSync(path, options)
  }

  Deno.close = (rid: number) => {
    const path = ridFileMap.get(rid)
    if (path) {
      console.log(path)
      // ridFileMap.delete(rid)
      // fileRidMap.delete(path)
      return
    }
    return close(rid)
  }
// }

export const database = new Database([
  "channels",
  "features"
])
