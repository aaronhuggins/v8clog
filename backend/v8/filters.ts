import { DiffEntry, Entity } from "../deps.ts";

const messageIntents = [
  "\\d",
  "Merged r",
  "Port r",
  "Revision \\d",
  "Push version",
  "Merge r",
  "Update V8",
  "Create V8",
  "Squashed",
  "Changed version",
  "owners",
  "test",
  "branch cut",
  "Bump",
  "Revert",
  "Reland",
  "Re-land",
  "Rollback",
  "cleanup",
  "task",
  "build",
  "builtins",
  "cppgc",
  "cpgpc",
  "version \\d",
];
const messageIrrelevant = new RegExp(
  `^(Merged: |fix\\(){0,1}\\[{0,1}(${messageIntents.join("|")})`,
  "gui",
);
const excludeAuthor = /^(V8 Autoroll|v8-ci-autoroll-builder).*$/gui;
export const isAuthor = (author: Entity) =>
  author.name.match(excludeAuthor) === null;

export const isRelevant = (message: string) =>
  message.match(messageIrrelevant) === null;
export const filterTags = (subject: string): string[] => {
  const tagRe = /\[([A-Za-z0-9\+_\-]+)\]/gui;
  return (subject.match(tagRe) ?? []).map((tag) =>
    tag.substring(1, tag.length - 1).toLowerCase()
  );
};
const _isV8 = (diffs: DiffEntry[]) =>
  diffs.some((diff) => {
    return (/^include\/v8.*\.h$/gui).test(diff.old_path) ||
      (/^include\/v8.*\.h$/gui).test(diff.new_path);
  });
