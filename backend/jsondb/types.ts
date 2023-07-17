// deno-lint-ignore-file ban-types
export type Document<T extends {}> = { _id: string } & T;
export type DocumentQuery<T extends {} = {}> = (
  doc: Document<T>,
) => Document<T> | boolean | undefined;
