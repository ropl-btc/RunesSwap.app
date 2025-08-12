// Popular runes list - maintained manually for easy updates
// You can modify this list directly to add/remove popular runes
export const POPULAR_RUNES = [
  {
    token_id: '840010:907',
    token: 'LIQUIDIUM•TOKEN',
    symbol: '🫠',
    icon: 'https://icon.unisat.io/icon/runes/LIQUIDIUM•TOKEN',
    is_verified: true,
  },
  {
    token_id: '840000:45',
    token: 'MAGIC•INTERNET•MONEY',
    symbol: '🧙',
    icon: 'https://icon.unisat.io/icon/runes/MAGIC•INTERNET•MONEY',
    is_verified: true,
  },
  {
    token_id: '840000:41',
    token: 'PUPS•WORLD•PEACE',
    symbol: '☮',
    icon: 'https://ordiscan.com/runes/PUPSWORLDPEACE.jpeg',
    is_verified: true,
  },
  {
    token_id: '865193:4006',
    token: 'GIZMO•IMAGINARY•KITTEN',
    symbol: '😺',
    icon: 'https://icon.unisat.io/icon/runes/GIZMO•IMAGINARY•KITTEN',
    is_verified: true,
  },
  {
    token_id: '845764:84',
    token: 'BILLION•DOLLAR•CAT',
    symbol: '🐱',
    icon: 'https://icon.unisat.io/icon/runes/BILLION•DOLLAR•CAT',
    is_verified: true,
  },
  {
    token_id: '840000:3',
    token: 'DOG•GO•TO•THE•MOON',
    symbol: '🐕',
    icon: 'https://icon.unisat.io/icon/runes/DOG•GO•TO•THE•MOON',
    is_verified: true,
  },
  {
    token_id: '840000:28',
    token: 'RSIC•GENESIS•RUNE',
    symbol: '⧈',
    icon: 'https://icon.unisat.io/icon/runes/RSIC•GENESIS•RUNE',
    is_verified: true,
  },
];

/**
 * Get the popular runes list
 * @returns Array of popular runes
 */
export function getPopularRunes(): typeof POPULAR_RUNES {
  return POPULAR_RUNES;
}
