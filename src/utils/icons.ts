/** Returns the local icon path for a champion. */
export function getChampionIconUrl(championId: string): string {
  return `/icons/champions/${championId}.png`
}

/** Returns the local icon path for an item (base component or completed). */
export function getItemIconUrl(itemId: string): string {
  return `/icons/items/${itemId}.png`
}

/** Returns the local icon path for a god. */
export function getGodIconUrl(godId: string): string {
  return `/icons/gods/${godId}.png`
}

/** Returns the local icon path for the dummy/golem unit. */
export const DUMMY_ICON_URL = '/icons/champions/dummy.png'
