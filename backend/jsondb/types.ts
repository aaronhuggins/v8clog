// deno-lint-ignore-file ban-types
export type Document<T extends {}> = { _id: string } & T;
