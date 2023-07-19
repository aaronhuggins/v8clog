import { DiffEntry, Entity } from "../deps.ts";

export function subjectTags(subject: string): string[] {
  const tags = new Set<string>(["v8"]);
  const lower = subject.toLowerCase().trim();
  if (!isRelevant(lower)) {
    return [];
  }
  for (const tag of prefixParser(lower)) {
    tags.add(tag);
  }
  let tag = "";
  let tagStarted = false;
  for (const char of lower) {
    const isStart = char === SEP.BR1;
    const isEnd = char === SEP.BR2;
    if (isEnd && tagStarted) {
      for (const subtag of subtagParser(tag)) {
        tags.add(subtag);
      }
      tagStarted = false;
      tag = "";
    } else if (isStart && tagStarted) {
      tagStarted = false;
      tag = "";
    } else if (isStart) {
      tagStarted = true;
    } else if (tagStarted) {
      tag += char;
    }
  }
  for (const [keyword, tag] of KEYWORDS) {
    if (lower.includes(keyword)) {
      tags.add(tag);
    }
  }
  return Array.from(tags);
}

export function isValidChange(
  change: { author: Entity; message: string },
): boolean {
  const [subject] = change.message.split("\n");
  return isAuthor(change.author) && isRelevant(subject.trim());
}

export function isRelevant(lower: string): boolean {
  if (
    EXCLUDE.START.some((term) => lower.startsWith(term)) ||
    EXCLUDE.CONTAINS.some((term) => lower.includes(term)) ||
    EXCLUDE.PREFIX.some((term) => lower.includes(term))
  ) {
    return false;
  }
  return true;
}

export function isAuthor(author: Entity): boolean {
  for (const term of EXCLUDE.AUTHOR) {
    if (
      author.name.toLowerCase().includes(term) ||
      author.email.toLowerCase().includes(term)
    ) {
      return false;
    }
  }
  return true;
}

export function hasV8File(diffs: DiffEntry[]): boolean {
  return diffs.some((diff) =>
    isV8File(diff.new_path) || isV8File(diff.old_path)
  );
}

const SEP = {
  BR1: "[",
  BR2: "]",
  COL: ":",
  COM: ",",
  SLS: "/",
} as const;
const EXCLUDE = {
  AUTHOR: [
    "v8 autoroll",
    "v8-ci-autoroll-builder",
  ] as const,
  START: [
    "[release",
    "rename",
    "merge r",
    "merged r",
    "port r",
    "revision ",
    "push version ",
    "update V8",
    "create V8",
    "squashed ",
    "changed version ",
    "branch cut ",
    "bump ",
    "revert ",
    "reland ",
    "reland^",
    "re-land ",
    "(reland)",
    "rollback ",
    "version ",
  ] as const,
  CONTAINS: [
    "c++",
    "cpp",
    "cpgpc",
    "owners",
    "doc",
  ] as const,
  TAGS: [
    "owners",
    "test",
    "branch cut",
    "cleanup",
    "task",
    "build",
    "bump",
    "devtools",
    "dev tools",
    "dev-tools",
    "docs",
    "tracing w",
    "include",
    "iwyu",
    "tools",
    "functionentryhook",
    "promisehook",
  ] as const,
  TAG_CONTAINS: [
    "step",
  ] as const,
  PREFIX: [
    "bump",
    "merge",
    "merged",
    "reland",
    "revert",
    "revision",
    "rollback",
    "squashed",
    "rename",
  ] as const,
} as const;
const KEYWORDS: [string, string][] = Object.entries({
  "wasm": "webassembly",
  "wsam": "webassembly",
  "wsm": "webassembly",
  "masm": "webassembly",
  "webassembly": "webassembly",
  "javascript": "javascript",
  "heap": "heap",
  "oom": "heap",
  "oilpan": "oilpan",
  "api": "api",
  "stack": "stack",
  "platform": "platform",
  "ios": "ios",
  "osx": "osx",
  "os x": "osx",
  "windows": "windows",
  "linux": "linux",
  "posix": "posix",
  "runtime": "runtime",
  "sandbox": "sandbox",
  "arraybuffer": "arraybuffers",
  "array buffer": "arraybuffers",
  "object": "objects",
  "function": "functions",
  "compile hints": "compile hints",
  "arm64": "arm64",
  "ppc": "ppc",
  "x64": "x64",
  "inspector": "inspector",
  "async iterator": "asynciterator",
  "asynciterator": "asynciterator",
  "iterator": "iterator",
  "stringbuffer": "strings",
  "promise": "promises",
  "atomics": "atomics",
  "array.": "arrays",
  "array ": "arrays",
  "isolate": "isolate-data",
  "microtask": "microtasks",
  "properyname": "objects",
  "date": "date",
  "strings": "strings",
  "builtin": "builtins",
  "built-in": "builtins",
  "sharedarraybuffer": "sharedarraybuffers",
  "json": "json",
  "typedarray": "typedarrays",
  "tracing": "tracing",
  "module": "modules",
  "android": "android",
  "arrayprototype": "arrays",
  "asmjs": "asmjs",
  "asm.js": "asmjs",
  "proxy": "proxy",
  "asyncfunction": "asyncfunctions",
  "async function": "asyncfunctions",
});
const NORMALIZE: Record<string, string> = {
  "typedarray": "typedarrays",
  "atomic": "atomics",
  "microtask": "microtasks",
  "array": "arrays",
  "module": "modules",
  "promise": "promises",
  "isolate": "isolate-data",
  "arraybuffer": "arraybuffers",
  "object": "objects",
  "function": "functions",
  "symbol": "symbols",
  "number": "numbers",
  "bigint": "bigints",
  "string": "strings",
  "inspector protocol": "inspector",
  "masm": "wasm",
  "wsam": "wasm",
  "wsm": "wasm",
  "logging": "log",
  "cpu-profiler": "profiler",
  "cpu profiler": "profiler",
  "heap-profiler": "profiler",
  "heap profiler": "profiler",
  "embedder-tracing": "tracing",
  "embedder tracing": "tracing",
  "jobs-api": "jobs",
  "jobs api": "jobs",
  "heap-snapshot": "heap",
  "ro-heap": "heap",
  "wasm-debug-eval": "wasm",
  "wasm-simd": "wasm",
  "stack-trace": "stack",
  "global-handles": "handles",
  "global-handle": "handles",
  "handle": "handles",
  "parsing": "parser",
  "libplatform": "platform",
  "v8 platform": "platform",
  "builtin": "builtins",
  "sharedarraybuffer": "sharedarraybuffers",
  "async-iteration": "asynciterator",
  "valueserializer": "serializer",
};
function isV8File(name: string): boolean {
  return name.startsWith("include/v8") && name.endsWith(".h");
}
function normalizeTag(tag: string): string {
  return NORMALIZE[tag] ?? tag;
}
function subtagParser(tag: string): string[] {
  const split = tag.includes(SEP.COM) ? tag.split(SEP.COM) : tag.split(SEP.SLS);
  return split.map((subtag) => {
    const trimmed = subtag.trim();
    if (
      // Exclude irrelevant tags.
      EXCLUDE.TAGS.some((term) => trimmed === term) ||
      EXCLUDE.TAG_CONTAINS.some((term) => trimmed.includes(term))
    ) {
      return "";
    }
    if (trimmed.includes(SEP.COM) || trimmed.includes(SEP.SLS)) {
      return subtagParser(trimmed);
    }
    return normalizeTag(trimmed);
  }).filter((parsed) => parsed !== "").flat();
}
function prefixParser(lower: string): string[] {
  const sepIndex = lower.indexOf(SEP.COL);
  const tags: string[] = [];
  if (sepIndex > 0 && sepIndex !== lower.length - 1) {
    // Colon-pair or uri is a source code name, not a tag.
    const nextChar = lower[sepIndex + 1];
    if (nextChar === SEP.COL || nextChar === SEP.SLS) {
      return tags;
    }
    const prefix = lower.substring(0, sepIndex).trim();
    // Tag-formatted prefix will be picked up by tag parser.
    if (prefix.startsWith(SEP.BR1)) {
      return tags;
    }
    tags.push(...subtagParser(prefix));
  }
  return tags;
}
