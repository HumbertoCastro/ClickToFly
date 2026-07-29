export const SHELF_MODULE_CAPACITY = 4;

export function groupShelfEntries<T>(items: readonly T[]): T[][] {
  const modules: T[][] = [];

  for (let index = 0; index < items.length; index += SHELF_MODULE_CAPACITY) {
    modules.push(items.slice(index, index + SHELF_MODULE_CAPACITY));
  }

  return modules;
}
