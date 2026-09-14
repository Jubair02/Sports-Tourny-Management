// Deterministic Unsplash image URLs for the public site.
// All images are formatted to keep payloads small.

const U = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;

// Sport-themed banner / hero images
export const SPORT_BANNER: Record<string, string> = {
  FOOTBALL: U("1574629810360-7efbbe195018", 1200),
  CRICKET: U("1531415074968-036ba1b575da", 1200),
  FUTSAL: U("1517466787929-bc90951d0974", 1200),
  BADMINTON: U("1606107557195-0e29a4b5b4aa", 1200),
  BASKETBALL: U("1546519638-68e109498ffc", 1200),
  VOLLEYBALL: U("1592656094267-764a45160876", 1200),
  TABLE_TENNIS: U("1536202013898-687112356f6b", 1200),
  ESPORTS: U("1542751371-adc38448a05e", 1200),
};

// Generic tournament banner pool — used when a tournament has no banner set.
export const TOURNAMENT_BANNERS = [
  U("1551958219-acbc608c6377", 1200), // stadium lights
  U("1517649763962-0c623066013b", 1200), // crowd in stadium
  U("1461896836934-ffe607ba8211", 1200), // stadium seats
  U("1577223625816-474ef4772644", 1200), // soccer field at night
  U("1552674605-db6ffd4facb5", 1200), // cricket ground
  U("1519861531473-9200262188bf", 1200), // tennis court
];

export const VENUE_IMAGES = [
  U("1459865264687-93c9c469f9b6", 1000), // stadium wide
  U("1429962712256-87457089755a", 1000), // field with stands
  U("1547149600-302f86c95b55", 1000), // arena
  U("1574629810360-7efbbe195018", 1000), // ball on field
];

export const PLAYER_AVATARS = [
  U("1500648767791-00dcc994a43e", 200),
  U("1507003211169-0d1efbce4d8a", 200),
  U("1494790108377-be9c29b29330", 200),
  U("1506794778202-cad84cf45f1d", 200),
  U("1518791841217-8f162f1e1131", 200),
  U("1502685104226-ee32379fefbe", 200),
];

// Hero image used on the landing page
export const HERO_IMAGE = U("1574629810360-7efbbe195018", 1600);

export function sportBanner(sport?: string | null): string {
  if (sport && SPORT_BANNER[sport]) return SPORT_BANNER[sport];
  return TOURNAMENT_BANNERS[0];
}

export function pickImage(
  pool: string[],
  seed?: string | number | null,
): string {
  if (seed == null || seed === "") return pool[0];
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}
