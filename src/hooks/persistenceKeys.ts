export const UI_PERSISTENCE_PREFIX = "entrybase:ui:v1";
export const SCROLL_PERSISTENCE_PREFIX = "entrybase:scroll:v1";

export function buildUiStateKey(userId: number, pageKey: string) {
  return `${UI_PERSISTENCE_PREFIX}:user:${userId}:page:${pageKey}`;
}

export function buildScrollKey(userId: number, pageKey: string) {
  return `${SCROLL_PERSISTENCE_PREFIX}:user:${userId}:page:${pageKey}`;
}
