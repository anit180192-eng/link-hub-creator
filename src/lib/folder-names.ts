/** Every link belongs to a named folder, including legacy unfiled links. */
export function folderName(value: string | null | undefined): string {
  return value?.trim() || "Folder 1";
}
