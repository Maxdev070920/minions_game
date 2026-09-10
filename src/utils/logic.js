import { GAME } from "../game/config/constants";
export function parseStored(raw, fallback, validate = () => true) {
  try {
    const value = JSON.parse(raw);
    return value !== null && validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export function cooldownRemaining(lastUsed, now, duration) {
  return Math.max(0, Math.min(duration, duration - (now - lastUsed) / 1000));
}
export function calculateScore({ won, cores, elapsed, damage, abilityUses }) {
  return Math.max(
    0,
    cores * 250 +
      (won ? 1500 + Math.round(Math.max(0, GAME.duration - elapsed) * 25) : 0) -
      damage * 100 +
      Math.min(abilityUses, 10) * 25,
  );
}
export function generateResult(stats) {
  const result = {
    id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
    date: new Date().toISOString(),
    ...stats,
    elapsed: Math.max(0, Math.min(GAME.duration, stats.elapsed)),
  };
  return {
    ...result,
    score: calculateScore(result),
    xp: result.cores * 15 + (result.won ? 120 : 20),
  };
}
export function filterInventory(items, category, rarity) {
  return items.filter(
    (i) =>
      (category === "All items" || i.category === category) &&
      (rarity === "All rarities" || i.rarity === rarity),
  );
}
