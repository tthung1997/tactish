export const DUMMY_ID_PREFIX = '__dummy_'

export function isDummy(championId: string): boolean {
  return championId.startsWith(DUMMY_ID_PREFIX)
}

export function newDummyId(): string {
  return `${DUMMY_ID_PREFIX}${crypto.randomUUID()}`
}
