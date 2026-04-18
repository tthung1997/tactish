/** Returns the local icon path for a champion. */
export function getChampionIconUrl(championId: string): string {
  return `/icons/champions/${championId}.png`
}

/** Returns the local icon path for an item (base component or completed). */
export function getItemIconUrl(itemId: string): string {
  if (itemId.endsWith('-emblem')) {
    return `/icons/emblems/${itemId.slice(0, -'-emblem'.length)}.png`
  }
  return `/icons/items/${itemId}.png`
}

/** Returns the local icon path for a god. */
export function getGodIconUrl(godId: string): string {
  return `/icons/gods/${godId}.png`
}

/** Returns the local icon path for the dummy/golem unit. */
export const DUMMY_ICON_URL = '/icons/champions/dummy.png'

/** Returns the local icon path for a trait emblem (spatula item). Returns null if no emblem exists for that trait. */
export function getEmblemIconUrl(traitId: string): string {
  return `/icons/emblems/${traitId}.png`
}
