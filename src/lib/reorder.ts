import { folderName } from "./folder-names";
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  )
    return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}
// Give published views and HTML exports the same folder order as the builder.
// Copy positions only for presentation; stored link order remains untouched.
export function orderLinksByFolders<
  T extends {
    tab_id?: string | null;
    group_name: string | null;
    position: number;
  },
>(
  links: T[],
  folders: { tab_id: string; name: string; position: number }[],
  firstTab?: string,
): T[] {
  const ranks = new Map<string, number>();
  for (const folder of folders)
    ranks.set(
      JSON.stringify([folder.tab_id, folderName(folder.name)]),
      folder.position,
    );
  const tabs = new Map<string, T[]>();
  for (const link of links) {
    const tab = link.tab_id || firstTab || "";
    const group = tabs.get(tab) || [];
    group.push(link);
    tabs.set(tab, group);
  }
  return [...tabs.entries()]
    .flatMap(([tab, group]) =>
      group.sort(
        (a, b) =>
          (ranks.get(JSON.stringify([tab, folderName(a.group_name)])) ??
            Number.MAX_SAFE_INTEGER) -
            (ranks.get(JSON.stringify([tab, folderName(b.group_name)])) ??
              Number.MAX_SAFE_INTEGER) || a.position - b.position,
      ),
    )
    .map((link, position) => ({ ...link, position }));
}
