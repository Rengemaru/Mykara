export const MAX_TAB_NAME_LENGTH = 30;
export const MAX_TAB_DISPLAY_LENGTH = 7;

export function truncateTabName(name: string): string {
  return name.length > MAX_TAB_DISPLAY_LENGTH
    ? name.slice(0, MAX_TAB_DISPLAY_LENGTH) + '…'
    : name;
}
