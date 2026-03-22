/**
 * Migrate legacy category names (AGOS/SULONG/ALON) to new names (Express/Standard/Technical)
 */

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  AGOS: "Express",
  SULONG: "Standard",
  ALON: "Technical",
  agos: "Express",
  sulong: "Standard",
  alon: "Technical",
  LINGKOD: "Standard",
};

const CATEGORY_TIME_MAP: Record<string, number> = {
  Express: 5,
  Standard: 15,
  Technical: 45,
};

export const migrateLegacyCategory = (oldCategory: string): string => {
  if (!oldCategory) return "Standard";
  if (["Express", "Standard", "Technical"].includes(oldCategory)) return oldCategory;
  const mapped = LEGACY_CATEGORY_MAP[oldCategory];
  if (mapped) {
    console.log(`🔄 Migrating category: ${oldCategory} → ${mapped}`);
    return mapped;
  }
  console.warn(`⚠️ Unknown category "${oldCategory}", defaulting to Standard`);
  return "Standard";
};

export const getRecommendedTimeForCategory = (category: string): number => {
  return CATEGORY_TIME_MAP[category] || 15;
};
