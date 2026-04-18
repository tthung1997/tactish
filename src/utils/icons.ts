const DDRAGON_VERSION = '16.8.1'
const DDRAGON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/tft-item`
const CDRAGON_BASE = 'https://raw.communitydragon.org/latest/game/assets/characters'

// Champion IDs that can't simply have dashes stripped to get CDragon key
const CHAMPION_KEY_OVERRIDES: Record<string, string> = {
  'the-mighty-mech': 'galio',      // TFT17_Galio in CDragon
  'meepsie':         'ivernminion', // TFT17_IvernMinion in CDragon
}

// Champions whose tileIcon file name differs from the standard pattern
const CHAMPION_URL_OVERRIDES: Record<string, string> = {
  'rhaast': `${CDRAGON_BASE}/tft17_rhaast/hud/tft17_kayn_slay_square.tft_set17.png`,
}

// Items whose Set 17 display name differs from the underlying game file name
const ITEM_DDRAGON_KEY_OVERRIDES: Record<string, string> = {
  'edge-of-night':   'TFT_Item_GuardianAngel',
  'void-staff':      'TFT_Item_StatikkShiv',
  'krakens-fury':    'TFT_Item_RunaansHurricane',
  'red-buff':        'TFT_Item_RapidFireCannon',
  'spirit-visage':   'TFT_Item_Redemption',
  'protectors-vow':  'TFT_Item_FrozenHeart',
  'steadfast-heart': 'TFT_Item_NightHarvester',
  'strikers-flail':  'TFT_Item_PowerGauntlet',
  'evenshroud':      'TFT_Item_SpectralGauntlet',
  'nashors-tooth':   'TFT_Item_Leviathan',
  // Base components with non-trivial conversions
  'bf-sword':              'TFT_Item_BFSword',
  'needlessly-large-rod':  'TFT_Item_NeedlesslyLargeRod',
  'tear-of-the-goddess':   'TFT_Item_TearOfTheGoddess',
  'chain-vest':            'TFT_Item_ChainVest',
  'negatron-cloak':        'TFT_Item_NegatronCloak',
  'giants-belt':           'TFT_Item_GiantsBelt',
  'sparring-gloves':       'TFT_Item_SparringGloves',
  'recurve-bow':           'TFT_Item_RecurveBow',
  // Apostrophe/possessive normalisation
  'guinsoos-rageblade':    'TFT_Item_GuinsoosRageblade',
  'rabadons-deathcap':     'TFT_Item_RabadonsDeathcap',
  'archangels-staff':      'TFT_Item_ArchangelsStaff',
  'dragons-claw':          'TFT_Item_DragonsClaw',
  'warmogs-armor':         'TFT_Item_WarmogsArmor',
  'thiefs-gloves':         'TFT_Item_ThiefsGloves',
  'steraks-gage':          'TFT_Item_SteraksGage',
  'giant-slayer':          'TFT_Item_MadredsBloodrazor',
  'hand-of-justice':       'TFT_Item_UnstableConcoction',
  'sunfire-cape':          'TFT_Item_RedBuff',
}

/** Returns the Set 17 square icon URL for a champion. */
export function getChampionIconUrl(championId: string): string {
  if (CHAMPION_URL_OVERRIDES[championId]) return CHAMPION_URL_OVERRIDES[championId]
  const key = CHAMPION_KEY_OVERRIDES[championId] ?? championId.replace(/-/g, '')
  return `${CDRAGON_BASE}/tft17_${key}/hud/tft17_${key}_square.tft_set17.png`
}

/** Returns the item icon URL from Data Dragon (works for both base components and completed items). */
export function getItemIconUrl(itemId: string): string {
  if (ITEM_DDRAGON_KEY_OVERRIDES[itemId]) {
    return `${DDRAGON_BASE}/${ITEM_DDRAGON_KEY_OVERRIDES[itemId]}.png`
  }
  // Default: capitalise each dash-separated word and join
  const key = 'TFT_Item_' + itemId
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
  return `${DDRAGON_BASE}/${key}.png`
}
