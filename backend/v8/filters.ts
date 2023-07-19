import { DiffEntry, Entity } from "../deps.ts";

export function subjectTags(subject: string): string[] {
  const tags = new Set<string>();
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
    const isStart = char === "[";
    const isEnd = char === "]";
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

export function isAuthor(author: Entity): boolean {
  for (const term of EXCLUDE.AUTHOR) {
    if (author.name.includes(term) || author.email.includes(term)) {
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
    "re-land ",
    "rollback ",
    "version ",
  ] as const,
  CONTAINS: [
    "cppgc",
    "cpgpc",
  ] as const,
  TAGS: [
    "owners",
    "test",
    "branch cut",
    "cleanup",
    "task",
    "build",
    "builtins",
    "bump",
    "devtools",
    "dev tools",
    "dev-tools",
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
  ] as const,
} as const;
const KEYWORDS: [string, string][] = Object.entries({
  "wasm": "webassembly",
  "webassembly": "webassembly",
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
  "win": "windows",
  "linux": "linux",
  "runtime": "runtime",
  "sandbox": "sandbox",
  "arraybuffer": "arraybuffer",
  "object": "object",
  "function": "function",
  "compile hints": "compile hints",
});
const NORMALIZE: Record<string, string> = {
  "arraybuffers": "arraybuffer",
  "inspector protocol": "inspector",
};
function isV8File(name: string): boolean {
  return name.startsWith("include/v8") && name.endsWith(".h");
}
function isRelevant(lower: string): boolean {
  for (const term of EXCLUDE.START) {
    if (lower.startsWith(term)) {
      return false;
    }
  }
  for (const term of EXCLUDE.CONTAINS) {
    if (lower.includes(term)) {
      return false;
    }
  }
  return true;
}
function normalizeTag(tag: string): string {
  return NORMALIZE[tag] ?? tag;
}
function subtagParser(tag: string): string[] {
  const split = tag.includes(SEP.COM) ? tag.split(SEP.COM) : tag.split(SEP.SLS);
  return split.map((subtag) => {
    const trimmed = subtag.trim();
    if (
      // Ignore any prefixes in excludes array.
      EXCLUDE.PREFIX.some((term) => trimmed === term) ||
      // Exclude irrelevant tags.
      EXCLUDE.TAGS.some((term) => trimmed === term)
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
  const sep = ":";
  const sepIndex = lower.indexOf(sep);
  const tags: string[] = [];
  if (sepIndex > 0 && sepIndex !== lower.length - 1) {
    // Colon-pair or uri is a source code name, not a tag.
    const nextChar = lower[sepIndex + 1];
    if (nextChar === sep || nextChar === "/") {
      return tags;
    }
    const prefix = lower.substring(0, sepIndex).trim();
    // Tag-formatted prefix will be picked up by tag parser.
    if (prefix.startsWith("[")) {
      return tags;
    }
    tags.push(...subtagParser(prefix));
  }
  return tags;
}
