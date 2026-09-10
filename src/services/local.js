import { parseStored, generateResult } from "../utils/logic";
import { CHARACTERS, COSMETICS, DEFAULT_SETTINGS } from "../data/catalog";
const read = (key, fallback, validate) => {
  try {
    return parseStored(localStorage.getItem("mote:" + key), fallback, validate);
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem("mote:" + key, JSON.stringify(value));
  } catch {
    /* Play remains available when storage is disabled. */
  }
  return value;
};
export const playerService = {
  get: () =>
    read(
      "player",
      { name: "Lab Rookie", xp: 0, balance: 0, selected: "volt" },
      (v) =>
        v &&
        typeof v === "object" &&
        Number.isFinite(v.xp) &&
        v.xp >= 0 &&
        Number.isFinite(v.balance) &&
        CHARACTERS.some((c) => c.id === v.selected),
    ),
  save: (v) => write("player", v),
};
export const settingsService = {
  get: () => {
    const v = read(
      "settings",
      {},
      (v) => v && typeof v === "object" && !Array.isArray(v),
    );
    return Object.fromEntries(
      Object.entries(DEFAULT_SETTINGS).map(([k, d]) => [
        k,
        typeof v[k] === typeof d
          ? typeof d === "number"
            ? Math.max(0, Math.min(100, v[k]))
            : v[k]
          : d,
      ]),
    );
  },
  save: (v) => write("settings", v),
};
export const inventoryService = {
  items: COSMETICS,
  get: () =>
    read(
      "equipped",
      {},
      (v) =>
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        Object.entries(v).every(([category, id]) =>
          COSMETICS.some(
            (i) => i.category === category && i.id === id && !i.locked,
          ),
        ),
    ),
  equip: (item) => {
    if (item.locked) return inventoryService.get();
    return write("equipped", {
      ...inventoryService.get(),
      [item.category]: item.id,
    });
  },
};
export const missionService = {
  history: () =>
    read(
      "results",
      [],
      (v) =>
        Array.isArray(v) &&
        v.every(
          (r) =>
            r &&
            typeof r.id === "string" &&
            Number.isFinite(r.score) &&
            Number.isFinite(r.elapsed),
        ),
    ),
  best: () => read("best", 0, (v) => Number.isFinite(v) && v >= 0),
  finish: (stats) => {
    const r = generateResult(stats);
    write("results", [r, ...missionService.history()].slice(0, 5));
    write("best", Math.max(r.score, missionService.best()));
    const p = playerService.get();
    playerService.save({ ...p, xp: p.xp + r.xp, balance: p.balance + r.cores });
    return r;
  },
};
export const walletService = {
  getProfile: (state = "disconnected") => ({
    state,
    address: state === "connected" ? "0xDEMO…0000" : null,
    network: "Prototype network",
    isMock: true,
  }),
  states: ["disconnected", "connecting", "connected", "wrong network", "error"],
};
