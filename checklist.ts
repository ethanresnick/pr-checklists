type Mappings = {
  triggers: string[] | "always";
  items: string[];
}[];

export function getChecklist(diff: string, mappings: Mappings) {
  if (!diff || !mappings) return [];

  const diffInLowerCase = diff.toLowerCase();

  return mappings.flatMap((mapping) => {
    const triggers = Array.isArray(mapping.triggers)
      ? mapping.triggers
      : [mapping.triggers];

    return triggers
      .map((it) => it.toLowerCase())
      .some(
        (triggerInLowerCase) =>
          triggerInLowerCase === "always" ||
          diffInLowerCase.includes(triggerInLowerCase)
      )
      ? mapping.items
      : [];
  });
}

export function formatChecklist(checklist: string[]) {
  return checklist.length
    ? `**Checklist:**\n${checklist.map((it) => `- [ ] ${it}`).join("\n")}`
    : "";
}

export function getFormattedChecklist(diff: string, mappings: Mappings) {
  const checklist = getChecklist(diff, mappings);
  return formatChecklist(checklist);
}
