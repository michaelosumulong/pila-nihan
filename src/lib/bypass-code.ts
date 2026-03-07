/**
 * Generates a deterministic daily 6-character bypass code
 * based on the current date and a merchant seed.
 */
export const generateDailyBypassCode = (seed: string = "pila-nihan"): string => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const raw = `${seed}-${today}`;

  // Simple hash → 6 alphanumeric chars
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[hash % chars.length];
    hash = Math.floor(hash / chars.length) + (hash % 7) + i;
  }

  return code;
};

export const validateBypassCode = (input: string, seed?: string): boolean => {
  return input.toUpperCase().replace(/\s/g, "") === generateDailyBypassCode(seed);
};
