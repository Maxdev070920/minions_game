import { describe, it, expect, vi, afterEach } from "vitest";
import {
  calculateScore,
  cooldownRemaining,
  generateResult,
  filterInventory,
  parseStored,
} from "./logic";
import { COSMETICS } from "../data/catalog";
import {
  playerService,
  settingsService,
  inventoryService,
  missionService,
} from "../services/local";
afterEach(() => vi.unstubAllGlobals());
describe("mission logic", () => {
  it("rewards a successful escape and time left", () => {
    expect(
      calculateScore({
        won: true,
        cores: 8,
        elapsed: 60,
        damage: 1,
        abilityUses: 2,
      }),
    ).toBe(4200);
  });
  it("never produces negative scores", () =>
    expect(
      calculateScore({
        won: false,
        cores: 0,
        elapsed: 90,
        damage: 3,
        abilityUses: 0,
      }),
    ).toBe(0));
  it("caps ability farming bonuses", () =>
    expect(
      calculateScore({
        won: false,
        cores: 0,
        elapsed: 90,
        damage: 0,
        abilityUses: 100,
      }),
    ).toBe(250));
  it("clamps cooldown between zero and full duration", () => {
    expect(cooldownRemaining(1000, 4000, 8)).toBe(5);
    expect(cooldownRemaining(1000, 12000, 8)).toBe(0);
    expect(cooldownRemaining(1000, 0, 8)).toBe(8);
  });
  it("generates complete mission results", () => {
    const r = generateResult({
      won: true,
      cores: 8,
      elapsed: 50,
      damage: 0,
      abilityUses: 2,
      character: "volt",
    });
    expect(r).toMatchObject({ xp: 240, score: 4550, character: "volt" });
    expect(r.id).toBeTruthy();
    expect(Number.isNaN(Date.parse(r.date))).toBe(false);
  });
});
describe("inventory", () => {
  it("combines category and rarity filters", () => {
    expect(
      filterInventory(COSMETICS, "Visors", "Epic").map((i) => i.id),
    ).toEqual(["visor"]);
    expect(
      filterInventory(COSMETICS, "All items", "All rarities"),
    ).toHaveLength(8);
    expect(filterInventory(COSMETICS, "Footwear", "Epic")).toEqual([]);
  });
  it("does not equip locked items", () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn() });
    expect(inventoryService.equip(COSMETICS.find((i) => i.locked))).toEqual({});
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
describe("storage resilience", () => {
  it("parses valid data", () =>
    expect(parseStored('{"xp":2}', {})).toEqual({ xp: 2 }));
  it.each(["{broken", "null", "undefined", ""])("falls back for %s", (raw) =>
    expect(parseStored(raw, { xp: 0 })).toEqual({ xp: 0 }),
  );
  it("rejects invalid shapes", () =>
    expect(parseStored("[]", { xp: 0 }, (v) => Number.isFinite(v.xp))).toEqual({
      xp: 0,
    }));
  it("services reject corrupt storage safely", () => {
    vi.stubGlobal("localStorage", { getItem: () => "{bad", setItem: vi.fn() });
    expect(playerService.get().selected).toBe("volt");
    expect(settingsService.get().master).toBe(70);
    expect(missionService.history()).toEqual([]);
  });
  it("validates settings and equipped items", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key) =>
        key.includes("settings")
          ? '{"master":999,"mute":"yes"}'
          : '{"Visors":"nonexistent"}',
      setItem: vi.fn(),
    });
    expect(settingsService.get()).toMatchObject({ master: 100, mute: false });
    expect(inventoryService.get()).toEqual({});
  });
  it("handles blocked storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("blocked");
      },
    });
    expect(playerService.get().xp).toBe(0);
    expect(() => playerService.save(playerService.get())).not.toThrow();
  });
  it("keeps five results and persists rewards and best score", () => {
    const data = {};
    vi.stubGlobal("localStorage", {
      getItem: (k) => data[k] ?? null,
      setItem: (k, v) => {
        data[k] = v;
      },
    });
    for (let i = 0; i < 7; i++)
      missionService.finish({
        won: true,
        cores: 8,
        elapsed: 40 + i,
        damage: 0,
        abilityUses: 1,
      });
    expect(missionService.history()).toHaveLength(5);
    expect(playerService.get().balance).toBe(56);
    expect(missionService.best()).toBe(4775);
  });
});
