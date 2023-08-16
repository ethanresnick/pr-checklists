import gitDiffParser from "gitdiff-parser";
import { type File } from "gitdiff-parser";
import { minimatch } from "minimatch";

type Mappings = {
  triggers: string[] | "always";
  items: string[];
  paths?: string | string[];
}[];

export function getChangeStringsByFile(gitDiff: string) {
  // ts-ignore + cast needed because the gitDiffParser package's built-in types
  // have a syntax error.
  // @ts-ignore
  const diffParsed = gitDiffParser.parse(gitDiff) as File[];

  // Map<filePath, diffString>.
  // each file gets up to two entries, for its old and new path.
  return new Map(
    diffParsed.flatMap((file) => {
      const fileDiffStringLowerCase = file.hunks
        .flatMap((it) => it.changes)
        .map((it) => it.content)
        .join("")
        .toLowerCase();

      return [
        [file.oldPath, fileDiffStringLowerCase],
        [file.newPath, fileDiffStringLowerCase],
      ];
    })
  );
}

export function getChecklist(
  changeStringsByFile?: Map<string, string>,
  mappings?: Mappings
) {
  if (!changeStringsByFile || !mappings) {
    return [];
  }

  const allChangesString = [...changeStringsByFile.values()].join("");

  const checklistItems = mappings.flatMap((mapping) => {
    const triggers = Array.isArray(mapping.triggers)
      ? mapping.triggers
      : [mapping.triggers];

    if (triggers.some((it) => it === "always")) {
      return mapping.items;
    }

    const { paths } = mapping;
    const [changesForMapping, matchingPaths] = paths
      ? (() => {
          const pathsArr = Array.isArray(paths) ? paths : [paths];
          const matchingFileEntries = [...changeStringsByFile.entries()].filter(
            ([fileName]) =>
              pathsArr.some((path) => minimatch(fileName, path, { dot: true }))
          );

          return [
            matchingFileEntries.map(([_, change]) => change).join(""),
            matchingFileEntries.map(([fileName]) => fileName),
          ];
        })()
      : [allChangesString, undefined];

    return triggers
      .map((it) => new RegExp(it, "i"))
      .some((it) => it.test(changesForMapping))
      ? mapping.items.map((it) =>
          matchingPaths ? `${it} (${matchingPaths.join(", ")})` : it
        )
      : [];
  });

  return [...new Set(checklistItems)];
}

export function formatChecklist(checklist: string[]) {
  return checklist.length
    ? `**Checklist:**\n${checklist.map((it) => `- [ ] ${it}`).join("\n")}`
    : "";
}

export function getFormattedChecklist(
  diff?: string | null,
  mappings?: Mappings | null
) {
  const changeStringsByFile = getChangeStringsByFile(diff ?? "");
  const checklist = getChecklist(changeStringsByFile, mappings ?? []);
  return formatChecklist(checklist);
}
