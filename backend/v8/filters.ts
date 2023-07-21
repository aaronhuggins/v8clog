import { DiffEntry, Entity } from "../deps.ts";

export function subjectTags(subject: string): string[] {
  const tags = new Set<string>(["v8"]);
  const lower = subject.toLowerCase().trim();
  if (!isRelevant(lower)) {
    return [];
  }
  prefixParser(lower, tags);
  tagParser(lower, tags);
  keywordSelector(lower, tags);
  return Array.from(tags);
}

export function isValidChange(
  change: { author: Entity; subject: string },
): boolean {
  return isAuthor(change.author) && isRelevant(change.subject.toLowerCase());
}

export function isRelevant(lower: string): boolean {
  return !EXCLUDE.START.some((term) => lower.startsWith(term)) &&
    !EXCLUDE.CONTAINS.some((term) => lower.includes(term)) &&
    !EXCLUDE.PREFIX.some((term) => lower.includes(term));
}

export function isAuthor(author: Entity): boolean {
  const nameLower = author.name.toLowerCase();
  const emailLower = author.email.toLowerCase();
  return !EXCLUDE.AUTHOR.some((term) =>
    nameLower.includes(term) || emailLower.includes(term)
  );
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
    "landing ",
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
  "symbol": "symbols",
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
  "cpuprofiler": "profiler",
  "heap-profiler": "profiler",
  "heap profiler": "profiler",
  "heapprofiler": "profiler",
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
function tagParser(lower: string, tags: Set<string>): void {
  let tag = "";
  let tagStarted = false;
  const { length } = lower;
  for (let i = 0; i < length; i++) {
    const char = lower.charAt(i);
    const isStart = char === SEP.BR1;
    const isEnd = char === SEP.BR2;
    if (isEnd && tagStarted) {
      subtagParser(tag, tags);
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
}
function subtagParser(tag: string, tags: Set<string>): void {
  const { length } = tag;
  let subtag = "";
  for (let i = 0; i < length; i++) {
    const char = tag.charAt(i);
    if (char === SEP.COM || char === SEP.SLS) {
      const trimmed = subtag.trim();
      if (!excludeTag(trimmed)) {
        tags.add(normalizeTag(trimmed));
      }
      subtag = "";
      continue;
    }
    subtag += char;
  }
  subtag = subtag.trim();
  if (!excludeTag(subtag)) {
    tags.add(normalizeTag(subtag));
  }
}
function prefixParser(lower: string, tags: Set<string>): void {
  // Tag-formatted prefix will be picked up by tag parser.
  if (lower.startsWith(SEP.BR1)) {
    return;
  }
  const sepIndex = lower.indexOf(SEP.COL);
  if (sepIndex > 0 && sepIndex !== lower.length - 1) {
    // Colon-pair or uri is a source code name, not a tag.
    const nextChar = lower.charAt(sepIndex + 1);
    if (nextChar === SEP.COL || nextChar === SEP.SLS) {
      return;
    }
    subtagParser(lower.substring(0, sepIndex), tags);
  }
  return;
}
function keywordSelector(lower: string, tags: Set<string>): void {
  for (const [keyword, tag] of KEYWORDS) {
    if (!tags.has(tag) && lower.includes(keyword)) {
      tags.add(tag);
    }
  }
}
function normalizeTag(tag: string): string {
  return NORMALIZE[tag] ?? tag;
}
function excludeTag(tag: string): boolean {
  return tag == "" ||
    // Exclude irrelevant tags.
    EXCLUDE.TAGS.some((term) => tag === term) ||
    EXCLUDE.TAG_CONTAINS.some((term) => tag.includes(term));
}
function isV8File(name: string): boolean {
  return name.startsWith("include/v8") && name.endsWith(".h");
}
